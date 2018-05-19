import controller from 'browser/controllers/CapturesController'
import actionIds from 'browser/redux/actions/actionIds'
const {CACHE_CLIP, SHOW_CLIP, CLOSE_PLAYBACK} = actionIds

function cacheClip(clipId, gamertag){
    return {
        type: CACHE_CLIP,
        clipId,
        gamertag,
    }
}

function showClip(path){
    return {
        type: SHOW_CLIP,
        path,
    }
}

export function openClip(clipId, gamertag, dateTaken){
    return function(dispatch){
        dispatch(cacheClip(clipId, gamertag))
        return(
            controller.cacheClip(clipId, gamertag, dateTaken)
            .then((path)=>{
                dispatch(showClip(path))
            })
        )
    }
}

export function closePlayback(){
    return {
        type: CLOSE_PLAYBACK,
    }
}
