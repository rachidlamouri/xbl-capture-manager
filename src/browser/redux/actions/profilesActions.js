import controller from 'browser/controllers/CapturesController'
import actionIds from 'browser/redux/actions/actionIds'
const {FETCH_PROFILES, SET_PROFILES} = actionIds

function fetchProfiles(){
    return {
        type: FETCH_PROFILES,
    }
}

function setProfiles(records){
    return {
        type: SET_PROFILES,
        records,
    }
}

export function getProfiles(xuid){
    return function(dispatch){
        dispatch(fetchProfiles())
        
        return(
            controller.getProfiles()
            .then((records)=>{
                dispatch(setProfiles(records))
            })
        )
    }
}
