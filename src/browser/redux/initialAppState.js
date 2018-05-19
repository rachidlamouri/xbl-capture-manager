export function clipsState(){
    return {
        isFetching: false,
        records: [],
    }
}

export function playbackState(){
    return {
        isPlaying: false,
        isLoading: false,
        clipId: '',
        path: '',
        gamertag: '',
    }
}

export function initialAppState(){
    return {
        clips: clipsState(),
        playback: playbackState(),
    }
}
