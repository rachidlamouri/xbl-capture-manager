import {combineReducers} from 'redux'
import clips from './clips'
import playback from './playback'

export default combineReducers({
    clips,
    playback,
})
