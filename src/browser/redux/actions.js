import controller from 'browser/controllers/CapturesController'

export const actionIds = [
    'FETCH_CLIPS',
    'RECEIVED_CLIPS',
    'SHOW_CLIP',
    'CACHE_CLIP',
    'CLOSE_PLAYBACK',
].reduce((accumulator, current, index)=>{
    accumulator[current] = current
    return accumulator
}, {})

function fetchClips(){
    return {
        type: actionIds.FETCH_CLIPS,
        isFetching: true,
    }
}

function receivedClips(records){
    return {
        type: actionIds.RECEIVED_CLIPS,
        isFetching: false,
        records,
    }
}

export function getClips(){
    return function(dispatch){
        dispatch(fetchClips())
        return(
            controller.getClips()
            .then((records)=>{
                dispatch(receivedClips(records))
            })
        )
    }
}

function cacheClip(clipId, gamertag){
    return {
        type: actionIds.CACHE_CLIP,
        clipId,
        gamertag,
    }
}

function showClip(path){
    return {
        type: actionIds.SHOW_CLIP,
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
        type: actionIds.CLOSE_PLAYBACK,
    }
}
