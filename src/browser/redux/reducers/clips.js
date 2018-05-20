import {clipsState} from 'browser/redux/initialAppState'
import actionIds from 'browser/redux/actions/actionIds'
const {FETCH_CLIPS, RECEIVED_CLIPS, SET_MAX_PAGES, SET_PAGE} = actionIds

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
        case SET_MAX_PAGES:
            return Object.assign({}, state, {
                maxPages: action.maxPages,
            })
        case SET_PAGE:
            return Object.assign({}, state, {
                page: action.page,
            })
        default:
            return state
    }
}
