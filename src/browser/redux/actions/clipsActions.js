import controller from 'browser/controllers/CapturesController'
import actionIds from 'browser/redux/actions/actionIds'
const {FETCH_CLIPS, RECEIVED_CLIPS} = actionIds

function fetchClips(){
    return {
        type: FETCH_CLIPS,
        isFetching: true,
    }
}

function receivedClips(records){
    return {
        type: RECEIVED_CLIPS,
        isFetching: false,
        records,
    }
}

export function getClips(xuid){
    return function(dispatch){
        dispatch(fetchClips())
        return(
            controller.getClips(xuid)
            .then((records)=>{
                dispatch(receivedClips(records))
            })
        )
    }
}
