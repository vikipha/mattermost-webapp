// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ActionTypes, Constants} from 'utils/constants.jsx';
import AtMentionProvider from 'components/suggestion/at_mention_provider/at_mention_provider.jsx';
import AtMentionSuggestion from 'components/suggestion/at_mention_provider/at_mention_suggestion.jsx';
import AppDispatcher from 'dispatcher/app_dispatcher.jsx';

jest.mock('dispatcher/app_dispatcher.jsx', () => ({
    handleServerAction: jest.fn(),
    register: jest.fn(),
}));

describe('components/suggestion/at_mention_provider/AtMentionProvider', function() {
    const suggestionId = 'suggestionId';
    const baseParams = {
        currentUserId: 'userid1',
        currentTeamId: 'teamId',
        currentChannelId: 'channelId',
        profilesInChannel: [
            {id: 'userid10', username: 'nicknamer', first_name: '', last_name: '', nickname: 'Z'},
            {id: 'userid3', username: 'other', first_name: 'X', last_name: 'Y', nickname: 'Z'},
            {id: 'userid1', username: 'user', first_name: 'a', last_name: 'b', nickname: 'c'},
            {id: 'userid2', username: 'user2', first_name: 'd', last_name: 'e', nickname: 'f'},
        ],
        autocompleteUsers: jest.fn().mockResolvedValue(false),
    };

    beforeEach(() => {
        AppDispatcher.handleServerAction.mockClear();
    });

    it('should ignore pretexts that are not at-mentions', (done) => {
        const provider = new AtMentionProvider(baseParams);
        expect(provider.handlePretextChanged(suggestionId, '')).toEqual(false);
        expect(provider.handlePretextChanged(suggestionId, 'user')).toEqual(false);
        expect(provider.handlePretextChanged(suggestionId, 'this is a sentence')).toEqual(false);
        setTimeout(() => {
            expect(baseParams.autocompleteUsers).not.toHaveBeenCalled();
            done();
        }, 0);
    });

    it('should suggest for "@"', (done) => {
        const pretext = '@';
        const matchedPretext = '@';
        const params = {
            ...baseParams,
            autocompleteUsers: jest.fn().mockImplementation(() => new Promise((resolve) => {
                setTimeout(() => resolve({data:{
                    users: [
                        {id: 'userid4', username: 'user4', first_name: 'X', last_name: 'Y', nickname: 'Z'},
                    ],
                    out_of_channel: [
                        {id: 'userid5', username: 'user5', first_name: 'out', last_name: 'out', nickname: 'out'},
                    ],
                }}), 0);
            })),
        };

        const provider = new AtMentionProvider(params);
        expect(provider.handlePretextChanged(suggestionId, pretext)).toEqual(true);

        setTimeout(() => {
            expect(AppDispatcher.handleServerAction).toHaveBeenNthCalledWith(1, {
                type: ActionTypes.SUGGESTION_RECEIVED_SUGGESTIONS,
                id: suggestionId,
                matchedPretext,
                terms: [
                    '@here',
                    '@channel',
                    '@all',
                    '@nicknamer',
                    '@other',
                    '@user2',
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
                        type: Constants.MENTION_MEMBERS,
                        id: 'userid10',
                        username: 'nicknamer',
                        first_name: '',
                        last_name: '',
                        nickname: 'Z',
                    },
                    {
                        type: Constants.MENTION_MEMBERS,
                        id: 'userid3',
                        username: 'other',
                        first_name: 'X',
                        last_name: 'Y',
                        nickname: 'Z',
                    },
                    {
                        type: Constants.MENTION_MEMBERS,
                        id: 'userid2',
                        username: 'user2',
                        first_name: 'd',
                        last_name: 'e',
                        nickname: 'f',
                    },
                    {
                        type: Constants.MENTION_MORE_MEMBERS,
                        loading: true,
                    },
                ],
                component: AtMentionSuggestion,
            });

            expect(AppDispatcher.handleServerAction).toHaveBeenNthCalledWith(2, {
                type: ActionTypes.SUGGESTION_RECEIVED_SUGGESTIONS,
                id: suggestionId,
                matchedPretext,
                terms: [
                    '@here',
                    '@channel',
                    '@all',
                    '@nicknamer',
                    '@other',
                    '@user2',
                    '@user4',
                    '@user5',
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
                        type: Constants.MENTION_MEMBERS,
                        id: 'userid10',
                        username: 'nicknamer',
                        first_name: '',
                        last_name: '',
                        nickname: 'Z',
                    },
                    {
                        type: Constants.MENTION_MEMBERS,
                        id: 'userid3',
                        username: 'other',
                        first_name: 'X',
                        last_name: 'Y',
                        nickname: 'Z',
                    },
                    {
                        type: Constants.MENTION_MEMBERS,
                        id: 'userid2',
                        username: 'user2',
                        first_name: 'd',
                        last_name: 'e',
                        nickname: 'f',
                    },
                    {
                        type: Constants.MENTION_MEMBERS,
                        id: 'userid4',
                        username: 'user4',
                        first_name: 'X',
                        last_name: 'Y',
                        nickname: 'Z',
                    },
                    {
                        type: Constants.MENTION_NONMEMBERS,
                        id: 'userid5',
                        username: 'user5',
                        first_name: 'out',
                        last_name: 'out',
                        nickname: 'out',
                    },
                ],
                component: AtMentionSuggestion,
            });

            done();
        }, 50);
    });

    it('should suggest for "@h"', (done) => {
        const pretext = '@h';
        const matchedPretext = '@h';
        const params = {
            ...baseParams,
            autocompleteUsers: jest.fn().mockImplementation(() => new Promise((resolve) => {
                setTimeout(() => resolve({data:{
                    users: [],
                    out_of_channel: [],
                }}), 0);
            })),
        };

        const provider = new AtMentionProvider(params);
        expect(provider.handlePretextChanged(suggestionId, pretext)).toEqual(true);

        setTimeout(() => {
            expect(AppDispatcher.handleServerAction).toHaveBeenNthCalledWith(1, {
                type: ActionTypes.SUGGESTION_RECEIVED_SUGGESTIONS,
                id: suggestionId,
                matchedPretext,
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

            expect(AppDispatcher.handleServerAction).toHaveBeenNthCalledWith(2, {
                type: ActionTypes.SUGGESTION_RECEIVED_SUGGESTIONS,
                id: suggestionId,
                matchedPretext,
                terms: [
                    '@here',
                ],
                items: [
                    {
                        type: Constants.MENTION_SPECIAL,
                        username: 'here',
                    },
                ],
                component: AtMentionSuggestion,
            });

            done();
        }, 50);
    });

    it('should suggest for username match "@user"', (done) => {
        const pretext = '@user';
        const matchedPretext = '@user';
        const params = {
            ...baseParams,
            autocompleteUsers: jest.fn().mockImplementation(() => new Promise((resolve) => {
                setTimeout(() => resolve({data:{
                    users: [
                        {id: 'userid4', username: 'user4', first_name: 'X', last_name: 'Y', nickname: 'Z'},
                    ],
                    out_of_channel: [
                        {id: 'userid5', username: 'user5', first_name: 'out', last_name: 'out', nickname: 'out'},
                    ],
                }}), 0);
            })),
        };

        const provider = new AtMentionProvider(params);
        expect(provider.handlePretextChanged(suggestionId, pretext)).toEqual(true);

        setTimeout(() => {
            expect(AppDispatcher.handleServerAction).toHaveBeenNthCalledWith(1, {
                type: ActionTypes.SUGGESTION_RECEIVED_SUGGESTIONS,
                id: suggestionId,
                matchedPretext,
                terms: [
                    '@user2',
                    '',
                ],
                items: [
                    {
                        type: Constants.MENTION_MEMBERS,
                        id: 'userid2',
                        username: 'user2',
                        first_name: 'd',
                        last_name: 'e',
                        nickname: 'f',
                    },
                    {
                        type: Constants.MENTION_MORE_MEMBERS,
                        loading: true,
                    },
                ],
                component: AtMentionSuggestion,
            });

            expect(AppDispatcher.handleServerAction).toHaveBeenNthCalledWith(2, {
                type: ActionTypes.SUGGESTION_RECEIVED_SUGGESTIONS,
                id: suggestionId,
                matchedPretext,
                terms: [
                    '@user2',
                    '@user4',
                    '@user5',
                ],
                items: [
                    {
                        type: Constants.MENTION_MEMBERS,
                        id: 'userid2',
                        username: 'user2',
                        first_name: 'd',
                        last_name: 'e',
                        nickname: 'f',
                    },
                    {
                        type: Constants.MENTION_MEMBERS,
                        id: 'userid4',
                        username: 'user4',
                        first_name: 'X',
                        last_name: 'Y',
                        nickname: 'Z',
                    },
                    {
                        type: Constants.MENTION_NONMEMBERS,
                        id: 'userid5',
                        username: 'user5',
                        first_name: 'out',
                        last_name: 'out',
                        nickname: 'out',
                    },
                ],
                component: AtMentionSuggestion,
            });

            done();
        }, 50);
    });

    it('should suggest for first_name match "@X"', (done) => {
        const pretext = '@X';
        const matchedPretext = '@x';
        const params = {
            ...baseParams,
            autocompleteUsers: jest.fn().mockImplementation(() => new Promise((resolve) => {
                setTimeout(() => resolve({data:{
                    users: [
                        {id: 'userid4', username: 'user4', first_name: 'X', last_name: 'Y', nickname: 'Z'},
                    ],
                    out_of_channel: [],
                }}), 0);
            })),
        };

        const provider = new AtMentionProvider(params);
        expect(provider.handlePretextChanged(suggestionId, pretext)).toEqual(true);

        setTimeout(() => {
            expect(AppDispatcher.handleServerAction).toHaveBeenNthCalledWith(1, {
                type: ActionTypes.SUGGESTION_RECEIVED_SUGGESTIONS,
                id: suggestionId,
                matchedPretext,
                terms: [
                    '@other',
                    '',
                ],
                items: [
                    {
                        type: Constants.MENTION_MEMBERS,
                        id: 'userid3',
                        username: 'other',
                        first_name: 'X',
                        last_name: 'Y',
                        nickname: 'Z',
                    },
                    {
                        type: Constants.MENTION_MORE_MEMBERS,
                        loading: true,
                    },
                ],
                component: AtMentionSuggestion,
            });

            expect(AppDispatcher.handleServerAction).toHaveBeenNthCalledWith(2, {
                type: ActionTypes.SUGGESTION_RECEIVED_SUGGESTIONS,
                id: suggestionId,
                matchedPretext,
                terms: [
                    '@other',
                    '@user4',
                ],
                items: [
                    {
                        type: Constants.MENTION_MEMBERS,
                        id: 'userid3',
                        username: 'other',
                        first_name: 'X',
                        last_name: 'Y',
                        nickname: 'Z',
                    },
                    {
                        type: Constants.MENTION_MEMBERS,
                        id: 'userid4',
                        username: 'user4',
                        first_name: 'X',
                        last_name: 'Y',
                        nickname: 'Z',
                    },
                ],
                component: AtMentionSuggestion,
            });

            done();
        }, 50);
    });

    it('should suggest for last_name match "@Y"', (done) => {
        const pretext = '@Y';
        const matchedPretext = '@y';
        const params = {
            ...baseParams,
            autocompleteUsers: jest.fn().mockImplementation(() => new Promise((resolve) => {
                setTimeout(() => resolve({data:{
                    users: [
                        {id: 'userid4', username: 'user4', first_name: 'X', last_name: 'Y', nickname: 'Z'},
                    ],
                    out_of_channel: [],
                }}), 0);
            })),
        };

        const provider = new AtMentionProvider(params);
        expect(provider.handlePretextChanged(suggestionId, pretext)).toEqual(true);

        setTimeout(() => {
            expect(AppDispatcher.handleServerAction).toHaveBeenNthCalledWith(1, {
                type: ActionTypes.SUGGESTION_RECEIVED_SUGGESTIONS,
                id: suggestionId,
                matchedPretext,
                terms: [
                    '@other',
                    '',
                ],
                items: [
                    {
                        type: Constants.MENTION_MEMBERS,
                        id: 'userid3',
                        username: 'other',
                        first_name: 'X',
                        last_name: 'Y',
                        nickname: 'Z',
                    },
                    {
                        type: Constants.MENTION_MORE_MEMBERS,
                        loading: true,
                    },
                ],
                component: AtMentionSuggestion,
            });

            expect(AppDispatcher.handleServerAction).toHaveBeenNthCalledWith(2, {
                type: ActionTypes.SUGGESTION_RECEIVED_SUGGESTIONS,
                id: suggestionId,
                matchedPretext,
                terms: [
                    '@other',
                    '@user4',
                ],
                items: [
                    {
                        type: Constants.MENTION_MEMBERS,
                        id: 'userid3',
                        username: 'other',
                        first_name: 'X',
                        last_name: 'Y',
                        nickname: 'Z',
                    },
                    {
                        type: Constants.MENTION_MEMBERS,
                        id: 'userid4',
                        username: 'user4',
                        first_name: 'X',
                        last_name: 'Y',
                        nickname: 'Z',
                    },
                ],
                component: AtMentionSuggestion,
            });

            done();
        }, 50);
    });

    it('should suggest for nickname match "@Z"', (done) => {
        const pretext = '@Z';
        const matchedPretext = '@z';
        const params = {
            ...baseParams,
            autocompleteUsers: jest.fn().mockImplementation(() => new Promise((resolve) => {
                setTimeout(() => resolve({data:{
                    users: [
                        {id: 'userid4', username: 'user4', first_name: 'X', last_name: 'Y', nickname: 'Z'},
                    ],
                    out_of_channel: [],
                }}), 0);
            })),
        };

        const provider = new AtMentionProvider(params);
        expect(provider.handlePretextChanged(suggestionId, pretext)).toEqual(true);

        setTimeout(() => {
            expect(AppDispatcher.handleServerAction).toHaveBeenNthCalledWith(1, {
                type: ActionTypes.SUGGESTION_RECEIVED_SUGGESTIONS,
                id: suggestionId,
                matchedPretext,
                terms: [
                    '@nicknamer',
                    '@other',
                    '',
                ],
                items: [
                    {
                        type: Constants.MENTION_MEMBERS,
                        id: 'userid10',
                        username: 'nicknamer',
                        first_name: '',
                        last_name: '',
                        nickname: 'Z',
                    },
                    {
                        type: Constants.MENTION_MEMBERS,
                        id: 'userid3',
                        username: 'other',
                        first_name: 'X',
                        last_name: 'Y',
                        nickname: 'Z',
                    },
                    {
                        type: Constants.MENTION_MORE_MEMBERS,
                        loading: true,
                    },
                ],
                component: AtMentionSuggestion,
            });

            expect(AppDispatcher.handleServerAction).toHaveBeenNthCalledWith(2, {
                type: ActionTypes.SUGGESTION_RECEIVED_SUGGESTIONS,
                id: suggestionId,
                matchedPretext,
                terms: [
                    '@nicknamer',
                    '@other',
                    '@user4',
                ],
                items: [
                    {
                        type: Constants.MENTION_MEMBERS,
                        id: 'userid10',
                        username: 'nicknamer',
                        first_name: '',
                        last_name: '',
                        nickname: 'Z',
                    },
                    {
                        type: Constants.MENTION_MEMBERS,
                        id: 'userid3',
                        username: 'other',
                        first_name: 'X',
                        last_name: 'Y',
                        nickname: 'Z',
                    },
                    {
                        type: Constants.MENTION_MEMBERS,
                        id: 'userid4',
                        username: 'user4',
                        first_name: 'X',
                        last_name: 'Y',
                        nickname: 'Z',
                    },
                ],
                component: AtMentionSuggestion,
            });

            done();
        }, 50);
    });

    it('should suggest ignore out_of_channel if found locally', (done) => {
        const pretext = '@user';
        const matchedPretext = '@user';
        const params = {
            ...baseParams,
            autocompleteUsers: jest.fn().mockImplementation(() => new Promise((resolve) => {
                setTimeout(() => resolve({data:{
                    users: [
                        {id: 'userid4', username: 'user4', first_name: 'X', last_name: 'Y', nickname: 'Z'},
                    ],
                    out_of_channel: [
                        {id: 'userid2', username: 'user2', first_name: 'd', last_name: 'e', nickname: 'f'},
                        {id: 'userid5', username: 'user5', first_name: 'out', last_name: 'out', nickname: 'out'},
                    ],
                }}), 0);
            })),
        };

        const provider = new AtMentionProvider(params);
        expect(provider.handlePretextChanged(suggestionId, pretext)).toEqual(true);

        setTimeout(() => {
            expect(AppDispatcher.handleServerAction).toHaveBeenNthCalledWith(1, {
                type: ActionTypes.SUGGESTION_RECEIVED_SUGGESTIONS,
                id: suggestionId,
                matchedPretext,
                terms: [
                    '@user2',
                    '',
                ],
                items: [
                    {
                        type: Constants.MENTION_MEMBERS,
                        id: 'userid2',
                        username: 'user2',
                        first_name: 'd',
                        last_name: 'e',
                        nickname: 'f',
                    },
                    {
                        type: Constants.MENTION_MORE_MEMBERS,
                        loading: true,
                    },
                ],
                component: AtMentionSuggestion,
            });

            expect(AppDispatcher.handleServerAction).toHaveBeenNthCalledWith(2, {
                type: ActionTypes.SUGGESTION_RECEIVED_SUGGESTIONS,
                id: suggestionId,
                matchedPretext,
                terms: [
                    '@user2',
                    '@user4',
                    '@user5',
                ],
                items: [
                    {
                        type: Constants.MENTION_MEMBERS,
                        id: 'userid2',
                        username: 'user2',
                        first_name: 'd',
                        last_name: 'e',
                        nickname: 'f',
                    },
                    {
                        type: Constants.MENTION_MEMBERS,
                        id: 'userid4',
                        username: 'user4',
                        first_name: 'X',
                        last_name: 'Y',
                        nickname: 'Z',
                    },
                    {
                        type: Constants.MENTION_NONMEMBERS,
                        id: 'userid5',
                        username: 'user5',
                        first_name: 'out',
                        last_name: 'out',
                        nickname: 'out',
                    },
                ],
                component: AtMentionSuggestion,
            });

            done();
        }, 50);
    });
});
