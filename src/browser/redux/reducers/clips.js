import {clipsState} from 'browser/redux/initialAppState'
import actionIds from 'browser/redux/actions/actionIds'
const {FETCH_CLIPS, RECEIVED_CLIPS} = actionIds

export default function(state = clipsState(), action){
    switch(action.type){
        case FETCH_CLIPS:
            return Object.assign({}, state, {
                isFetching: true,
            })
        case RECEIVED_CLIPS:
            return Object.assign({}, state, {
                isFetching: true,
                records: action.records,
            })
        default:
            return state
    }
}
