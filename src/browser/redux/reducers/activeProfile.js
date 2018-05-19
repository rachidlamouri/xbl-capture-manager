import {profileState} from 'browser/redux/initialAppState'
import actionIds from 'browser/redux/actions/actionIds'
const {SET_ACTIVE_PROFILE} = actionIds

export default function(state = profileState(), action){
    switch(action.type){
        case SET_ACTIVE_PROFILE:
            return Object.assign({}, state, {
                xuid: action.record.XUID,
                gamertag: action.record.Gamertag,
            })
        default:
            return state
    }
}
