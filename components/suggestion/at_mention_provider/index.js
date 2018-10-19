// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {autocompleteUsers} from 'mattermost-redux/actions/users';
import {getCurrentTeamId} from 'mattermost-redux/selectors/entities/teams';
import {getCurrentUserId, getProfilesInCurrentChannel} from 'mattermost-redux/selectors/entities/users';
import {getCurrentChannelId} from 'mattermost-redux/selectors/entities/channels';

import AtMentionProvider from './at_mention_provider.jsx';

const mapStateToProps = (state, ownProps) => {
    const currentUserId = getCurrentUserId(state);
    const currentTeamId = getCurrentTeamId(state);
    const currentChannelId = getCurrentChannelId(state);
    const profilesInCurrentChannel = getProfilesInCurrentChannel(state).

    return {
        currentUserId,
        currentTeamId,
        currentChannelId,
        profilesInCurrentChannel,
    };
}

const mapDispatchToProps = (dispatch) => {
    return {
        actions: bindActionCreators({
            autocompleteUsers,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(AtMentionProvider);
