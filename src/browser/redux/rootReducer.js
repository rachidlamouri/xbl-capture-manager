import {combineReducers} from 'redux'
import clips from './reducers/clips'
import playback from './reducers/playback'
import activeProfile from './reducers/activeProfile'
import profiles from './reducers/profiles'

export default combineReducers({
    clips,
    playback,
    activeProfile,
    profiles,
})
