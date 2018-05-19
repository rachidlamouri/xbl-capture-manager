import {playbackState} from 'browser/redux/initialAppState'
import actionIds from 'browser/redux/actions/actionIds'
const {CACHE_CLIP, SHOW_CLIP, CLOSE_PLAYBACK} = actionIds

export default function(state = playbackState(), action){
    switch(action.type){
        case CACHE_CLIP:
            return Object.assign({}, state, {
                isPlaying: false,
                isLoading: true,
                clipId: action.clipId,
                gamertag: action.gamertag,
                path: '',
            })
        case SHOW_CLIP:
            return Object.assign({}, state, {
                isPlaying: true,
                isLoading: false,
                path: action.path,
            })
        case CLOSE_PLAYBACK:
            return Object.assign({}, state, {
                isPlaying: false,
                isLoading: false,
                clipId: '',
                path: '',
                gamertag: '',
            })
        default:
            return state
    }
}
