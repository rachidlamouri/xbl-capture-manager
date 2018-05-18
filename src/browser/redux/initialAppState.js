export function clipsState(){
    return {
        isFetching: false,
        records: [],
    }
}

export function initialAppState(){
    return {
        clips: clipsState(),
    }
}
