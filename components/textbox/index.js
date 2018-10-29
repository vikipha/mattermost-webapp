// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import {getCurrentUserId, getProfilesInCurrentChannel} from 'mattermost-redux/selectors/entities/users';
import {getCurrentTeamId} from 'mattermost-redux/selectors/entities/teams';
import {autocompleteUsers} from 'mattermost-redux/actions/users';

import Textbox from './textbox.jsx';

function mapStateToProps(state) {
    return {
        currentTeamId: getCurrentTeamId(state),
        currentUserId: getCurrentUserId(state),
        profilesInChannel: getProfilesInCurrentChannel(state),
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
            autocompleteUsers,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps, null, {withRef: true})(Textbox);
