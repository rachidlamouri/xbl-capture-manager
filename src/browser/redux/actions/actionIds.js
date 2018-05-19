const actionIds = [
    'FETCH_CLIPS',
    'RECEIVED_CLIPS',
    'SHOW_CLIP',
    
    'CACHE_CLIP',
    'CLOSE_PLAYBACK',
    
    'SET_ACTIVE_PROFILE',
    
    'FETCH_PROFILES',
    'SET_PROFILES',
].reduce((accumulator, current, index)=>{
    accumulator[current] = current
    return accumulator
}, {})

export default actionIds
