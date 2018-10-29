// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import XRegExp from 'xregexp';

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

    updateMatches(suggestionId, prefix, users) {
        const mentions = users.map((user) => {
            if (user.username) {
                return '@' + user.username;
            }
            return '';
        });

        AppDispatcher.handleServerAction({
            type: ActionTypes.SUGGESTION_RECEIVED_SUGGESTIONS,
            id: suggestionId,
            matchedPretext: `@${prefix}`,
            terms: mentions,
            items: users,
            component: AtMentionSuggestion,
        });
    }

    handlePretextChanged = (suggestionId, pretext) => {
        const captured = XRegExp.cache('(?:^|\\W)@([\\pL\\d\\-_.]*)$', 'i').exec(pretext.toLowerCase());
        if (!captured) {
            return false;
        }

        const prefix = captured[1];

        this.startNewRequest(suggestionId, prefix);

        SuggestionStore.clearSuggestions(suggestionId);

        // Attempt to match one of @here, @channel or @all.
        const specialMentions = ['here', 'channel', 'all'].filter((item) =>
            item.startsWith(prefix)
        ).map((name) => ({
            username: name,
            type: Constants.MENTION_SPECIAL,
        }));

        // Attempt to match against local results first, capping at 25. The profiles are already
        // sorted by username, matching the server behaviour and remote results to arrive below.
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

        // Build a dictionary to keep track of the local users for pairing up with the remote
        // results below.
        const localUserIds = {};
        localMembers.forEach((item) => {
            localUserIds[item.id] = true;
        });

        // Add a loading indicator in the dropdown given that more results are on their way.
        const loadingUsers = [{
            type: Constants.MENTION_MORE_MEMBERS,
            loading: true,
        }];

        // Piece everything together for the suggestion store. Do this asynchronously given the
        // flux store and the need to avoid dispatching within a dispatch.
        setTimeout(() => this.updateMatches(
            suggestionId,
            prefix,
            specialMentions.concat(localMembers).concat(loadingUsers)
        ), 0);

        // Query the server for remote results to add to the local results extracted above.
        this.autocompleteUsers(prefix, this.currentTeamId, this.currentChannelId).then((data) => {
            if (this.shouldCancelDispatch(prefix)) {
                return;
            }
            if (!data) {
                return;
            }

            // Filter remote users, removing the local users already found above and any mention
            // of the current user.
            const remoteMembers = (data.users || []).map((user) => ({
                type: Constants.MENTION_MEMBERS,
                ...user,
            })).filter((user) =>
                !localUserIds[user.id]
            ).filter((user) =>
                user.id !== this.currentUserId
            );

            // Merge the local and remote results for users in the channel, as we replace
            // everything in the suggestion store.
            const localAndRemoteMembers = localMembers.concat(remoteMembers).sort((a, b) =>
                a.username.localeCompare(b.username)
            );

            // The server also gives us users not in the channel. Note that we opted not to fetch
            // these results locally as its more likely to want to engage with someone in the
            // current context.
            const remoteNonMembers = (data.out_of_channel || []).map((user) => ({
                type: Constants.MENTION_NONMEMBERS,
                ...user,
            })).filter((user) =>
                !localUserIds[user.id]
            );

            // Piece everything together for the suggestion store.
            this.updateMatches(
                suggestionId,
                prefix,
                specialMentions.concat(localAndRemoteMembers).concat(remoteNonMembers)
            );
        });

        return true;
    }
}
