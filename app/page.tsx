'use client';

import { DecimalToNumber, IsStringValid, StringDateToDisplayDate } from '@/extension/string_extension';
import { CurrentUserRef, ICurrentPage, IDisplayPlace, IUserIndexedDB } from '@/model/useState_model';
import { ResponseModel } from '@/model/response_model';
import { Place } from '@prisma/client';
// import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { CalculatePlaceForDisplay, OrderPlaceByDistance } from '@/extension/calculation_extension';
import { PwaCurrentPage } from '@/model/enum_model';
import List from '@/component/mainpage/list';
import Navbar from '@/component/navbar';
import Map from '@/component/mainpage/map';
import Login from '@/component/login';
import Register from '@/component/register';
import Footer from '@/component/footer';
import AddList from '@/component/mainpage/addList';
import EvBattery from '@/component/mainpage/evbattery';
import Setting from '@/component/mainpage/setting';

// Initialize .ENV variable
const indexedDB_DBName: string = process.env.NEXT_PUBLIC_INDEXED_DB_NAME ?? "";
const indexedDB_DBVersion: number = +(process.env.NEXT_PUBLIC_INDEXED_DB_VERSION ?? "");
const indexedDB_UserStore: string = process.env.NEXT_PUBLIC_INDEXED_STORE_USER ?? "";
const indexedDB_UserKey: string = process.env.NEXT_PUBLIC_INDEXED_STORE_USER_KEY ?? "";
const baseUrlApi: string = process.env.NEXT_PUBLIC_BASEURL_API ?? "";

export default function Home() {

    // initialize router
    // const router = useRouter();

    // react hook initialize
    const user = useRef<CurrentUserRef>({
        userId: "", 
        userName: "", 
        userLocation: {
            latitude: -1,
            longitude: -1
        } 
    });
    const indexedDbUserStore = useRef<IDBObjectStore>();
    const isMountRound = useRef<boolean>(true);
    const skipIndexedDbOnSuccess = useRef<boolean>(false);
    const isForceFetch = useRef<boolean>(false);
    const [currentPage, setCurrentPage] = useState<ICurrentPage>({ pageName: PwaCurrentPage.ReminderList, successAlertBox: false });
    const [places, setPlaces] = useState<IDisplayPlace[]>();
    const [currentLocation, setCurrentLocation] = useState<GeolocationCoordinates>();
    const [orderByDistance, setOrderByDistance] = useState<boolean>(true);

    // check user creadential, fetch get place api, get current location
    useEffect(() => {

        // check user Credentials -> open indexedDB
        const request = indexedDB.open(indexedDB_DBName, indexedDB_DBVersion);

        // open indexedDB error handler
        request.onerror = (event: Event) => {
            alert("Can't open indexedDB.");
        }

        // open with indexedDB Initialize handler
        request.onupgradeneeded = () => {

            // create currentUser store
            const dbContext = request.result;
            dbContext.createObjectStore(indexedDB_UserStore, { keyPath: indexedDB_UserKey });

            // set variable for skip onsuccess function
            skipIndexedDbOnSuccess.current = true;

            // change to login page
            ChangeCurrentPage(PwaCurrentPage.Login);
            // router.replace('/auth/login');
        }

        // open indexedDB success handler
        request.onsuccess = () => {

            if (!skipIndexedDbOnSuccess.current)
            {
                // set up indexedDB
                const dbContext = request.result;
    
                // check store name is exist
                if (dbContext.objectStoreNames.contains(indexedDB_UserStore)) {
                    
                    // create transaction of indexedDB
                    const transaction = dbContext.transaction(indexedDB_UserStore, "readwrite")
                
                    // create store of indexedDB transaction and set it globle useRef
                    const store = transaction.objectStore(indexedDB_UserStore);
                    indexedDbUserStore.current = store;


                    // get current user from indexedDB
                    const response = indexedDbUserStore.current.get(indexedDB_UserKey);
        
                    // get fail handler
                    response.onerror = () => {
                        // change to login page
                        ChangeCurrentPage(PwaCurrentPage.Login);
                        // router.replace('/auth/login');
                    }
        
                    // get success handler
                    response.onsuccess = () => {
        
                        // set global current UserId and UserName
                        const userIdResponse = (response.result as IUserIndexedDB)?.id;
                        const userNameResponse = (response.result as IUserIndexedDB)?.name;

                        if (IsStringValid(userIdResponse) && IsStringValid(userNameResponse)) {
                            user.current.userId = userIdResponse;
                            user.current.userName = userNameResponse;
    
                            // get current location -> after get location it will call fetch place api (or get state of place if any) 
                            // for get place data with calculated distanceLocation.
                            const watchId = navigator.geolocation.watchPosition(IfGetLocationSuccess, IfGetLocationError, geoLocationOption);
                        }
                        else {
                            // change to login page
                            ChangeCurrentPage(PwaCurrentPage.Login);
                        }
                    }
                }
                else {
                    // change to login page
                    ChangeCurrentPage(PwaCurrentPage.Login);
                    // router.replace('/auth/login');
                }
            }
        }

    }, [])

    // useEffect for reFetch data
    useEffect(() => {

        // check if mount rount
        if (!isMountRound.current) {

            if (currentPage.pageName == PwaCurrentPage.ReminderList) {
                console.log(currentLocation);
                FetchPlaceData();
            }            
        } 
        else {
            console.log("Mount Round!")
            isMountRound.current = false;
        }

    }, [currentLocation, currentPage, orderByDistance])

    // fetch place data from api
    const FetchPlaceData = async () => {

        try {
            // check current user from global variable
            if (IsStringValid(user.current.userId)) {

                // initialize list of DisplayPlace
                let displayPlaces: IDisplayPlace[] = [];
                
                // check if palce [is not undefined], and [check if force fetch is enable]
                if (places && places.at(0)?.userId == user.current.userId && !isForceFetch.current) {

                    console.log("not fetch");

                    // calculate distance between
                    displayPlaces = CalculatePlaceForDisplay(places, user.current.userLocation);
                } 
                else {

                    // fetch get api
                    console.log("fetch get place api");
                    const response = await fetch(`${baseUrlApi}/place/?userId=${user.current.userId}`);
    
                    if (!response.ok) {
            
                        const errorMessage: ResponseModel = await response.json();
                        alert(`Error message: ${errorMessage.message}`);
                    }
                    else {

                        // reset isForceFetch ref data
                        isForceFetch.current = false;

                        const placeResponse: Place[] = await response.json();
                        console.log(placeResponse);
    
                        // calculate distance between and parse placeData to IDisplayPlaceData
                        displayPlaces = CalculatePlaceForDisplay(placeResponse, user.current.userLocation);
                    }
                }

                // set user State and check OrderBy distance
                setPlaces(OrderPlaceByDistance(displayPlaces, orderByDistance));
            }
            else {
                alert(`Error message: User not found.`);
            }
        }
        catch(error) {
            alert(error);
        }
    }

    // success case for Geolocation
    const IfGetLocationSuccess = (position: GeolocationPosition) => {
        
        console.log('success location');

        // set current user location
        user.current.userLocation.latitude = position.coords.latitude;
        user.current.userLocation.longitude = position.coords.longitude;

        setCurrentLocation(position.coords);
    }

    // error case for Geolocation
    const IfGetLocationError = (error : GeolocationPositionError) => {

        alert(`${error.code}: ${error.message}`)
    }

    // option srtting for Geolocation
    const geoLocationOption: PositionOptions = {
        enableHighAccuracy: true, // use hign accuraacy location
        timeout: 60000, // 60 sec or 1 min timeout
        maximumAge: 0, // no location cache
    }

    // change Current page method
    const ChangeCurrentPage = (page: PwaCurrentPage, successBox: boolean = false, forceFetch = false) => {

        // set force fetch in FetchData function
        isForceFetch.current = forceFetch;

        // change current page
        setCurrentPage({
            pageName: page,
            successAlertBox: successBox
        });
    }

    const SetCurrentUser = (setUser: CurrentUserRef) => {
        user.current.userId = setUser.userId;
        user.current.userName = setUser.userName;
    }

    const DeletePlaceHandler = (placeId: string) => {
        setPlaces(places?.filter(e => e.id != placeId));
    }

    const ChangePlaceStatusHandler = (placeId: string, setIsDisable: boolean) => {

        setPlaces(places?.map(e => {

            if (e.id === placeId) {
                e.isDisable = setIsDisable;
            }

            return e;
        }));
    }

    const ChangeOrderByDistanceHandler = (orderByDistance: boolean) => {
        setOrderByDistance(orderByDistance);
    }

    // change color theme
    // useEffect(() => {
    //     var a = document.getElementById("bgColor");
    //     if (a != null){
    //         console.log("not null")
    //         a.style.backgroundColor = "#36393e"
    //     }
    // }, [])

    return (
        <main>
            <Navbar 
                currentPageName={currentPage.pageName} 
                orderByDistanceValue={orderByDistance}
                changeOrderByDistanceHandler={ChangeOrderByDistanceHandler}
            ></Navbar>
            <br /> <br />
            <div className="container">
                <div className='py-5 px-3'>
                    {
                        (() => {
                            switch (currentPage.pageName) {

                                case PwaCurrentPage.ReminderList:
                                    return <List 
                                        places={places}
                                        currentUser={user.current}
                                        deletePlaceHandler={DeletePlaceHandler}  
                                        changePlaceStatusHandler={ChangePlaceStatusHandler}
                                    ></List>

                                case PwaCurrentPage.MapView:
                                    return <Map></Map>

                                case PwaCurrentPage.AddList:
                                    return <AddList 
                                        userId={user.current.userId}
                                        changeCurrentPage={ChangeCurrentPage}
                                    ></AddList>

                                case PwaCurrentPage.EvBattery:
                                    return <EvBattery></EvBattery>

                                case PwaCurrentPage.Setting:
                                    return <Setting
                                        currentUserName={user.current.userName}
                                        changeCurrentPage={ChangeCurrentPage}
                                    ></Setting>

                                case PwaCurrentPage.Login:
                                    return <Login 
                                        currentPage={currentPage}
                                        setCurrentUser={SetCurrentUser} 
                                        changeCurrentPage={ChangeCurrentPage}
                                    ></Login>

                                case PwaCurrentPage.Register:
                                    return <Register
                                        changeCurrentPage={ChangeCurrentPage}
                                    ></Register>
                            }
                        })()
                    }
                </div>
            </div>
            <br /><br />
            <Footer changeCurrentPage={ChangeCurrentPage} currentPageName={currentPage.pageName}></Footer>
        </main>
    )
  }

              {/* {
                !IsStringValid(User.current.userId) ? 
                <h1>loading...</h1> : 
                <>
                    <div>
                        <Link href="/auth/login" replace={true}>Login</Link>
                        &nbsp; &nbsp; &nbsp;
                        <button onClick={UserLogout}>logout</button>
                        &nbsp; &nbsp; &nbsp;
                        <Link href="/auth/register">Register page</Link>
                    </div>
                    <div>
                        <ul>
                            {
                                places.length > 0 ?
                                places.map((place, index) => 
                                    <li key={index}>
                                        ({place.locationDistance}) - , 
                                        {place.name}, 
                                        {place.latitude?.toString()}, 
                                        {place.longitude?.toString()}, 
                                        {place.reminderMessage ?? "-"},
                                        {StringDateToDisplayDate(place.reminderDate)}
                                        <input type="checkbox" checked={!place.isDisable} onChange={() => ChangePlaceStatus(index, place.isDisable)}/>
                                        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
                                        <button onClick={DeletePlace} value={place.id}>delete</button>
                                    </li>
                                )
                                : <p>No place data...</p>
                            }
                        </ul>
                    </div>
                    <br />
                    <br />
                    <div>
                        <h2>Current location: {`${currentLocation?.latitude ?? '-'}, ${currentLocation?.longitude ?? '-'}`}</h2>
                    </div>
                    <br />
                    <br />
                    <div>
                        <div>
                            <h2>Add New Place</h2>
                            <p>PlaceName:</p>
                            <input id="placeNameInput" type="text" required/>
                            <p>Latitude:</p>
                            <input id="latitudeInput" type="number" step={.1} required/>
                            <p>Longitude:</p>
                            <input id="longitudeInput" type="number" step={.1} required/>
                            <p>Reminder Message:</p>
                            <input id="reminderMessageInput" type="text" required/>
                            <p>Reminder Date:</p>
                            <input id="reminderDateInput" type="date" required/>
                        </div>
                        <br />
                        <button onClick={AddNewPlace}>add place</button>
                    </div>
                </>
            } */}