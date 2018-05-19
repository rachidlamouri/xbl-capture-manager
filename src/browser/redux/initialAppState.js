export function profileState(){
    return {
        xuid: '',
        gamertag: '',
    }
}

export function profilesState(){
    return {
        isFetching: false,
        records: [],
    }
}

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
        activeProfile: profileState(),
        profiles: profilesState(),
        clips: clipsState(),
        playback: playbackState(),
    }
}
