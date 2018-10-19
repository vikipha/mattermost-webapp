// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import XRegExp from 'xregexp';
import PropTypes from 'prop-types';

import AppDispatcher from 'dispatcher/app_dispatcher.jsx';
import {ActionTypes, Constants} from 'utils/constants.jsx';
import SuggestionStore from 'stores/suggestion_store.jsx';

import Provider from '../provider.jsx';
import AtMentionSuggestion from './at_mention_suggestion.jsx';

export default class AtMentionProvider extends Provider {
    constructor({currentChannelId, currentUserId, currentTeamId, profilesInCurrentChannel, autocompleteUsers}) {
        super();

        this.currentChannelId = currentChannelId;
        this.currentUserId = currentUserId;
        this.currentTeamId = currentTeamId;
        this.profilesInCurrentChannel = profilesInCurrentChannel;
        this.autocompleteUsers = autocompleteUsers;
    }

    handlePretextChanged(suggestionId, pretext) {
        const captured = XRegExp.cache('(?:^|\\W)@([\\pL\\d\\-_.]*)$', 'i').exec(pretext.toLowerCase());
        if (!captured) {
            return false;
        }

        const prefix = captured[1];

        this.startNewRequest(suggestionId, prefix);

        SuggestionStore.clearSuggestions(suggestionId);

        const specialMentions = ['here', 'channel', 'all'].filter((item) =>
            item.startsWith(prefix)
        ).map((name) => ({
            username: name,
            type: Constants.MENTION_SPECIAL,
        }));

        const prefixLower = prefix.toLowerCase();
        const localMembers = this.profilesInCurrentChannel.
            filter((item) => item.id !== this.currentUserId).
            filter((item) =>
                (item.username && item.username.toLowerCase().startsWith(prefixLower)) ||
                (item.first_name && item.first_name.toLowerCase().startsWith(prefixLower)) ||
                (item.last_name && item.last_name.toLowerCase().startsWith(prefixLower)) ||
                (item.nickname && item.nickname.toLowerCase().startsWith(prefixLower))
            ).
            map((item) => ({
                type: Constants.MENTION_MEMBERS,
                ...item,
            })).
            splice(0, 25);

        const localUserIds = {};
        localMembers.forEach((item) => {
            localUserIds[item.id] = true;
        });

        const loadingUsers = [{
            type: Constants.MENTION_MORE_MEMBERS,
            loading: true,
        }];
        const loadingMentions = [''];

        const members = specialMentions.concat(localMembers).concat(loadingUsers);
        const userMentions = specialMentions.concat(localMembers).map((item) => '@' + item.username).concat(loadingMentions);

        setTimeout(() => AppDispatcher.handleServerAction({
            type: ActionTypes.SUGGESTION_RECEIVED_SUGGESTIONS,
            id: suggestionId,
            matchedPretext: `@${captured[1]}`,
            terms: userMentions,
            items: members,
            component: AtMentionSuggestion,
        }), 0);

        this.autocompleteUsers(
            prefix,
            this.currentTeamId,
            this.currentChannelId
        ).then((data) => {
            if (this.shouldCancelDispatch(prefix)) {
                return;
            }
            if (!data) {
                return;
            }

            const remoteMembers = (data.users || []).map((user) => ({
                type: Constants.MENTION_MEMBERS,
                ...user,
            })).filter((user) =>
                !localUserIds[user.id]
            ).filter((user) =>
                user.id !== this.currentUserId
            );

            const members = localMembers.concat(remoteMembers).sort((a, b) =>
                a.username.localeCompare(b.username)
            );

            const remoteNonMembers = (data.out_of_channel || []).map((user) => ({
                type: Constants.MENTION_NONMEMBERS,
                ...user,
            }));

            const users = specialMentions.
                concat(members).
                concat(remoteNonMembers);
            const mentions = users.map((user) => '@' + user.username);

            AppDispatcher.handleServerAction({
                type: ActionTypes.SUGGESTION_RECEIVED_SUGGESTIONS,
                id: suggestionId,
                matchedPretext: `@${captured[1]}`,
                terms: mentions,
                items: users,
                component: AtMentionSuggestion,
            });
        });

        return true;
    }
}
