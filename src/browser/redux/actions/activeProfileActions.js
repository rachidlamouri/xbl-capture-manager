import controller from 'browser/controllers/CapturesController'
import actionIds from 'browser/redux/actions/actionIds'
const {SET_ACTIVE_PROFILE} = actionIds

import {getMaxPages} from 'browser/redux/actions/clipsActions'

export function setActiveProfile(record){
    return {
        type: SET_ACTIVE_PROFILE,
        record,
    }
}

export function setDefaultProfile(){
    return function(dispatch, getState){
        return(
            controller.getDefaultProfile()
            .then((record)=>{
                dispatch(setActiveProfile(record))
                
                let xuid = getState().activeProfile.xuid
                dispatch(getMaxPages())
            })
        )
    }
}
