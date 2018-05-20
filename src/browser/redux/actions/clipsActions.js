import controller from 'browser/controllers/CapturesController'
import actionIds from 'browser/redux/actions/actionIds'
const {FETCH_CLIPS, RECEIVED_CLIPS, SET_MAX_PAGES, SET_PAGE} = actionIds

// Get clips
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

export function getClips(xuid, page){
    return function(dispatch){
        dispatch(fetchClips())
        return(
            controller.getClips(xuid, page)
            .then((records)=>{
                dispatch(receivedClips(records))
            })
        )
    }
}

// Get max pages
function setMaxPages(maxPages){
    return {
        type: SET_MAX_PAGES,
        maxPages,
    }
}

export function getMaxPages(){
    return function(dispatch, getState){
        let xuid = getState().activeProfile.xuid
        return(
            controller.getMaxPages(xuid)
            .then((maxPages)=>{
                dispatch(setMaxPages(maxPages))
                dispatch(getClips(xuid, 1))
            })
        )
    }
}

// Pagination
export function setPage(page){
    return {
        type: SET_PAGE,
        page,
    }
}

export function decrementPage(){
    return function(dispatch, getState){
        let nextPage = getState().clips.page - 1
        
        if(nextPage < 1){
            return
        }
        
        let xuid = getState().activeProfile.xuid
        dispatch(setPage(nextPage))
        dispatch(getClips(xuid, nextPage))
    }
}

export function incrementPage(){
    return function(dispatch, getState){
        let nextPage = getState().clips.page + 1
        let maxPages = getState().clips.maxPages
        
        if(nextPage > maxPages){
            return
        }
        
        let xuid = getState().activeProfile.xuid
        dispatch(setPage(nextPage))
        dispatch(getClips(xuid, nextPage))
    }
}
