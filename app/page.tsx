'use client';

import { DecimalToNumber, IsStringValid, StringDateToDisplayDate } from '@/extension/string_extension';
import { IDisplayPlace, IUserIndexedDB, PlaceExtensionModel, UpdatePlace } from '@/model/subentity_model';
import { ResponseModel } from '@/model/response_model';
import { Place } from '@prisma/client';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { MouseEvent, useEffect, useState, useRef } from 'react';
import { GetDistanceBetweenPlace, OrderPlaceByDistance } from '@/extension/calculation_extension';

// Initialize .ENV variable
const indexedDB_DBName: string = process.env.NEXT_PUBLIC_INDEXED_DB_NAME ?? "";
const indexedDB_DBVersion: number = +(process.env.NEXT_PUBLIC_INDEXED_DB_VERSION ?? "");
const indexedDB_UserStore: string = process.env.NEXT_PUBLIC_INDEXED_STORE_USER ?? "";
const indexedDB_UserKey: string = process.env.NEXT_PUBLIC_INDEXED_STORE_USER_KEY ?? "";
const baseUrlApi: string = process.env.NEXT_PUBLIC_BASEURL_API ?? "";

export default function Home() {

    // initialize router
    const router = useRouter();

    // react hook initialize
    const currentUserId = useRef<string>("");
    const isMounted = useRef<boolean>(false);
    const skipIndexedDbOnSuccess = useRef<boolean>(false);
    const [places, setPlaces] = useState<IDisplayPlace[]>([]);
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
            console.log();

            // create currentUser store
            const dbContext = request.result;
            dbContext.createObjectStore(indexedDB_UserStore, { keyPath: indexedDB_UserKey });

            // set variable for skip onsuccess function
            skipIndexedDbOnSuccess.current = true;

            // Reroute to login page
            router.replace('/auth/login');
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
                
                    // create store of indexedDB transaction
                    const store = transaction.objectStore(indexedDB_UserStore);
                
                    // get current user from indexedDB
                    const response = store.get(indexedDB_UserKey);
        
                    // get fail handler
                    response.onerror = () => {
                        router.replace('/auth/login');
                    }
        
                    // get success handler
                    response.onsuccess = () => {
        
                        // set global currentUserId
                        currentUserId.current = (response.result as IUserIndexedDB).id;

                        // get current location -> after get location it will call fetch place api (or get state of place if any) for get place data with calculated distanceLocation.
                        const watchId = navigator.geolocation.watchPosition(IfGetLocationSuccess, IfGetLocationError, geoLocationOption);
                    }
                }
                else {
                    router.replace('/auth/login');
                }
            }
        }

    }, [])

    // effect for update location Distanct
    useEffect(() => {

        // check if mount rount
        if (isMounted.current) {

            console.log(currentLocation)
            FetchPlaceData();
        } 
        else {

            console.log("Mount round!")
            isMounted.current = true;
        }

    }, [currentLocation])

    // fetch place data from api
    const FetchPlaceData = async () => {

        try {
            // check current user from global variable
            if (IsStringValid(currentUserId.current)) {

                let calculationPlace: Place[];
                
                // check if palce exist (more than 0 record)
                if (places.length > 0) {
                    calculationPlace = places;
                } 
                else {

                    // fetch get api
                    const response = await fetch(`${baseUrlApi}/place/?userId=${currentUserId.current}`);
        
                    if (!response.ok) {
            
                        const errorMessage: ResponseModel = await response.json();
                        alert(`Error message: ${errorMessage.message}`)

                        // set empty array
                        calculationPlace = [];
                    }
                    else {
                        console.log("fetch get place api");
                        calculationPlace = await response.json();
                    }
                }

                // find location distance
                const displayPlace = calculationPlace.map((e) => {

                    // get location distance for each place
                    const newTypePlace: IDisplayPlace = {
                        id: e.id,
                        name: e.name,
                        latitude: e.latitude,
                        longitude: e.longitude,
                        reminderMessage: e.reminderMessage,
                        reminderDate: e.reminderDate,
                        isDisable: e.isDisable,
                        createdAt: e.createdAt,
                        userId: e.userId,
                        locationDistance: GetDistanceBetweenPlace({
                            latitude_1: currentLocation?.latitude,
                            longitude_1: currentLocation?.longitude,
                            latitude_2: DecimalToNumber(e.latitude),
                            longitude_2: DecimalToNumber(e.longitude)
                        })
                    } 

                    return newTypePlace;
                })

                // set user State and check OrderBy distance
                setPlaces(orderByDistance ? OrderPlaceByDistance(displayPlace) : displayPlace);
            }
            else {
                alert(`Error message: User not found.`)
            }
        }
        catch(error) {
            alert(error)
        }
    }

    // success case for Geolocation
    const IfGetLocationSuccess = (position: GeolocationPosition) => {
        
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

    // logout handler
    const UserLogout = () => {
        alert("You are logout...");
        router.replace('/auth/login');
    }

    // delete place handler
    const DeletePlace = async (event : MouseEvent<HTMLButtonElement>): Promise<void> => {

        // get placeId
        const placeId = event.currentTarget.value;

        // fetch delete api
        const response = await fetch(`${baseUrlApi}/place/${placeId}`, { method: "DELETE" });

        if (!response.ok) {

            const errorMessage: ResponseModel = await response.json();
            alert(`Error message: ${errorMessage.message}`)
        }

        // set User state
        setPlaces(places.filter(e => e.id != placeId));
    }

    //change place active status handler
    const ChangePlaceStatus = async (index: number, isDisable: boolean) => {
        
        // prepare update place data
        const updateDisplayPlace = places[index];
        updateDisplayPlace.isDisable = !isDisable

        // Find the place object by placeId and update its isDisable property
        const newPlacesState = places.map((place, i) => {
            
            if (i == index) {
                return updateDisplayPlace;
            }

            return place;
        });

        // Update the places array with the modified object
        setPlaces(newPlacesState);

        // update place display status data with only
        const updatePlace: UpdatePlace = {
            id: updateDisplayPlace.id,
            isDisable: updateDisplayPlace.isDisable
        }

        // fetch update place api
        const response = await fetch(`${baseUrlApi}/place`, {
            method: "PUT",
            body: JSON.stringify(updatePlace)
        });

        if (!response.ok) {

            const errorMessage: ResponseModel = await response.json();
            alert(`Error message: ${errorMessage.message}`)
        }

    }

    // add place handler
    const AddNewPlace = async () => {

        // check current user from global variable   
        if (IsStringValid(currentUserId.current)) {

            // get data from input form
            const placeNameInput = document.getElementById("placeNameInput") as HTMLInputElement;
            const latitudeInput = document.getElementById("latitudeInput") as HTMLInputElement;
            const longitudeInput = document.getElementById("longitudeInput") as HTMLInputElement;
            const reminderMessageInput = document.getElementById("reminderMessageInput") as HTMLInputElement;
            const reminderDateInput = document.getElementById("reminderDateInput") as HTMLInputElement;

            const newPlace: PlaceExtensionModel = {
                name: placeNameInput.value,
                latitude: +latitudeInput.value, // cast string to number
                longitude: +longitudeInput.value, // cast string to number
                reminderMessage: IsStringValid(reminderMessageInput.value) ? reminderMessageInput.value : undefined,
                reminderDate: IsStringValid(reminderDateInput.value) ? new Date(reminderDateInput.value) : undefined,
                userId: currentUserId.current,
            }

            // fetch creaet place api
            const response = await fetch(`${process.env.baseUrlApi}/place`, {
                method: "POST",
                body: JSON.stringify(newPlace)
            });

            if (!response.ok) {
    
                const errorMessage: ResponseModel = await response.json();
                alert(`Error message: ${errorMessage.message}`)
            }
            
            // set place state
            FetchPlaceData();
        }
        else {
            alert(`Error message: User not found.`)
        }
    }

    return (
        <main>
            {
                !IsStringValid(currentUserId.current) ? 
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
            }
        </main>
    )
  }

// export default function Home() {
//   return (
//     <main className="flex min-h-screen flex-col items-center justify-between p-24">
//       <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
//         <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
//           Get started by editing&nbsp;
//           <code className="font-mono font-bold">app/page.tsx</code>
//         </p>
//         <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
//           <a
//             className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0"
//             href="https://vercel.com?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             By{' '}
//             <Image
//               src="/vercel.svg"
//               alt="Vercel Logo"
//               className="dark:invert"
//               width={100}
//               height={24}
//               priority
//             />
//           </a>
//         </div>
//       </div>

//       <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px]">
//         <Image
//           className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] dark:invert"
//           src="/next.svg"
//           alt="Next.js Logo"
//           width={180}
//           height={37}
//           priority
//         />
//       </div>

//       <div className="mb-32 grid text-center lg:mb-0 lg:grid-cols-4 lg:text-left">
//         <a
//           href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
//           className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <h2 className={`mb-3 text-2xl font-semibold`}>
//             Docs{' '}
//             <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
//               -&gt;
//             </span>
//           </h2>
//           <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
//             Find in-depth information about Next.js features and API.
//           </p>
//         </a>

//         <a
//           href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800 hover:dark:bg-opacity-30"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <h2 className={`mb-3 text-2xl font-semibold`}>
//             Learn{' '}
//             <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
//               -&gt;
//             </span>
//           </h2>
//           <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
//             Learn about Next.js in an interactive course with&nbsp;quizzes!
//           </p>
//         </a>

//         <a
//           href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
//           className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <h2 className={`mb-3 text-2xl font-semibold`}>
//             Templates{' '}
//             <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
//               -&gt;
//             </span>
//           </h2>
//           <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
//             Explore the Next.js 13 playground.
//           </p>
//         </a>

//         <a
//           href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
//           className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <h2 className={`mb-3 text-2xl font-semibold`}>
//             Deploy{' '}
//             <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
//               -&gt;
//             </span>
//           </h2>
//           <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
//             Instantly deploy your Next.js site to a shareable URL with Vercel.
//           </p>
//         </a>
//       </div>
//       <div>
//           <Link href="/auth/register">register</Link>
//       </div>
//     </main>
//   )
// }
