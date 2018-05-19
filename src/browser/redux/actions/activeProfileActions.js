import controller from 'browser/controllers/CapturesController'
import actionIds from 'browser/redux/actions/actionIds'
const {SET_ACTIVE_PROFILE} = actionIds

import {getClips} from 'browser/redux/actions/clipsActions'

export function setActiveProfile(record){
    return {
        type: SET_ACTIVE_PROFILE,
        record,
    }
}

export function setDefaultProfile(){
    return function(dispatch){
        return(
            controller.getDefaultProfile()
            .then((record)=>{
                dispatch(setActiveProfile(record))
                dispatch(getClips(record.XUID))
            })
        )
    }
}
