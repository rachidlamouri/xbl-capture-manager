import {profilesState} from 'browser/redux/initialAppState'
import actionIds from 'browser/redux/actions/actionIds'
const {FETCH_PROFILES, SET_PROFILES} = actionIds

export default function(state = profilesState(), action){
    switch(action.type){
        case FETCH_PROFILES:
            return Object.assign({}, state, {
                isFetching: true,
            })
        case SET_PROFILES:
            return Object.assign({}, state, {
                isFetching: false,
                records: action.records,
            })
        default:
            return state
    }
}
