// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {mount} from 'enzyme';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import {ActionTypes, Constants} from 'utils/constants.jsx';
import AtMentionProvider from 'components/suggestion/at_mention_provider/at_mention_provider.jsx';
import AtMentionSuggestion from 'components/suggestion/at_mention_suggestion.jsx';
import AppDispatcher from 'dispatcher/app_dispatcher.jsx';

// const mockStore = configureStore([thunk]);

jest.mock('dispatcher/app_dispatcher.jsx', () => ({
    handleServerAction: jest.fn(),
    register: jest.fn(),
}));

describe('components/SuggestionBox', function() {
    const baseProps = {
        currentUserId: 'channelId',
        currentTeamId: 'teamId',
        currentChannelId: 'channelId',
        profilesInCurrentChannel: [
            {id: 'userid1', username: 'user', first_name: 'a', last_name: 'b', nickname: 'c'},
            {id: 'userid2', username: 'user2', first_name: 'd', last_name: 'e', nickname: 'f'},
            {id: 'userid3', username: 'other', first_name: 'X', last_name: 'Y', nickname: 'Z'},
        ],
        actions: {
            autocompleteUsers: jest.fn(),
        },
    };

    it('should ignore pretexts that are not at-mentions', () => {
        const provider = <AtMentionProvider {...baseProps} />
        expect(provider.handlePretextChanged(suggestionId, '')).toEqual(false);
        expect(provider.handlePretextChanged(suggestionId, 'user')).toEqual(false);
        expect(provider.handlePretextChanged(suggestionId, 'this is a sentence')).toEqual(false);
    });

    it('should suggest for "@"', (done) => {
        const provider = <AtMentionProvider {...baseProps} />
        expect(provider.handlePretextChanged(suggestionId, '@')).toEqual(true);

        setTimeout(() => {
            expect(AppDispatcher.handleServerAction).toHaveBeenCalledWith({
                type: ActionTypes.SUGGESTION_RECEIVED_SUGGESTIONS,
                id: suggestionId,
                matchedPretext: '@',
                terms: [
                    '@here',
                    '@channel',
                    '@all',
                    '',
                ],
                items: [
                    {
                        type: Constants.MENTION_SPECIAL,
                        username: 'here',
                    },
                    {
                        type: Constants.MENTION_SPECIAL,
                        username: 'channel',
                    },
                    {
                        type: Constants.MENTION_SPECIAL,
                        username: 'all',
                    },
                    {
                        type: Constants.MENTION_MORE_MEMBERS,
                        loading: true,
                    },
                ],
                component: AtMentionSuggestion,
            });
            done();
        });
    });

    it('should suggest for "@h"', (done) => {
        const provider = <AtMentionProvider {...baseProps} />
        expect(provider.handlePretextChanged(suggestionId, '@h')).toEqual(true);

        setTimeout(() => {
            expect(AppDispatcher.handleServerAction).toHaveBeenCalledWith({
                type: ActionTypes.SUGGESTION_RECEIVED_SUGGESTIONS,
                id: suggestionId,
                matchedPretext: '@h',
                terms: [
                    '@here',
                    '',
                ],
                items: [
                    {
                        type: Constants.MENTION_SPECIAL,
                        username: 'here',
                    },
                    {
                        type: Constants.MENTION_MORE_MEMBERS,
                        loading: true,
                    },
                ],
                component: AtMentionSuggestion,
            });
            done();
        });
    });

    it('should suggest for "@user"', (done) => {
        const provider = new AtMentionProvider(channelId);
        expect(provider.handlePretextChanged(suggestionId, '@user')).toEqual(true);

        setTimeout(() => {
            expect(AppDispatcher.handleServerAction).toHaveBeenCalledWith({
                type: ActionTypes.SUGGESTION_RECEIVED_SUGGESTIONS,
                id: suggestionId,
                matchedPretext: '@user',
                terms: [
                    '',
                ],
                items: [
                    {
                        type: Constants.MENTION_MORE_MEMBERS,
                        loading: true,
                    },
                ],
                component: AtMentionSuggestion,
            });
            done();
        });
    });

    // it('should avoid ref access on unmount race', (done) => {
    //     const props = {
    //         listComponent: SuggestionList,
    //         value: 'value',
    //         containerClass: 'test',
    //         openOnFocus: true,
    //     };

    //     const wrapper = mount(
    //         <SuggestionBox {...props}/>
    //     );
    //     wrapper.instance().handleFocusIn({});
    //     wrapper.unmount();

    //     setTimeout(done, 100);
    // });
});
