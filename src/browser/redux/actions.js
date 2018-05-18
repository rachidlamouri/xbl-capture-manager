import controller from 'browser/controllers/CapturesController'

export const actionIds = [
    'FETCH_CLIPS',
    'RECEIVED_CLIPS',
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
