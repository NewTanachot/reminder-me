import { PwaCurrentPageEnum } from "@/model/enumModel";
import { ILoginProps } from "@/model/propsModel";
import { ResponseModel } from "@/model/responseModel";
import { UserExtensionModel } from "@/model/subentityModel";
import { User } from "@prisma/client";
import SuccessModal from "../modalAsset/success";
import { FormEvent, useState } from "react";
import { IsStringValidEmpty } from "@/extension/string_extension";
import { GetCustomGeoLocationOption } from "@/extension/api_extension";
import LoadingComponent from "../modalAsset/loading";

export default function Login({ userLoginHandler, changeCurrentPage, currentPage, isDarkTheme, baseUrlApi }: ILoginProps) {

    const [ displayLoadingComponent, setDisplayLoadingComponent ] = useState<boolean>(false);

    const UserLogin = async (event: FormEvent<HTMLFormElement>) => {

        // show loading component
        setDisplayLoadingComponent(true);

        event.preventDefault();
        const formInput = new FormData(event.currentTarget);
        
        // get data from input form
        const userNameInput = formInput.get("usernameInput")?.toString();
        const passWordInput = formInput.get("passwordInput")?.toString();

        const userNameValidateResult = IsStringValidEmpty(userNameInput);
        const passwordValidateResult = IsStringValidEmpty(passWordInput);

        if (userNameValidateResult != "" && passwordValidateResult != "") {

            const loginUser: UserExtensionModel = {
                name: userNameValidateResult,
                password: passwordValidateResult
            }

            // fetch add login api
            const response = await fetch(`${baseUrlApi}/user/login`, {
                method: "POST",
                body: JSON.stringify(loginUser)
            });

            if (!response.ok) {
                
                // check login error
                const errorMessage: ResponseModel = await response.json();
                alert(`Error message: ${errorMessage.message}`);

                // hide loading component
                setDisplayLoadingComponent(false);
            }
            else {

                // get currentUser user
                const currentUser: User = await response.json();

                // get current user geolocation
                navigator.geolocation.getCurrentPosition((position) => IfGetLocationSuccess(position, currentUser), 
                    IfGetLocationError, GetCustomGeoLocationOption());
            }
        }
        else {
            
            // hide loading component and alert error
            alert(`Error message: Username and Password is shouldn't be empty text.`);
            setDisplayLoadingComponent(false);
        }
    }

    // success case for Geolocation
    const IfGetLocationSuccess = (position: GeolocationPosition, currentUser: User) => {

        // set new user to useRef in list page
        userLoginHandler({ 
            userId: currentUser.id, 
            userName: currentUser.name,
            userLocation: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            }
        });

        // Reroute to card list page
        changeCurrentPage({ page: PwaCurrentPageEnum.ReminderList });
    }

    // error case for Geolocation
    const IfGetLocationError = (error : GeolocationPositionError) => {

        alert(`${error.code}: ${error.message}`)
    }

    const backButtonHandler = () => {
        changeCurrentPage({ page: PwaCurrentPageEnum.Setting });
    }

    // Color theme handler
    let cardColorTheme: string;
    let cardHeaderColorTheme: string;
    let textHeaderColorTheme: string;
    let formColorTheme: string;
    let loginBtnColorTheme: string;
    let cardBorderThemeColor: string;

    if (isDarkTheme) {
        cardColorTheme = "bg-mainGray";
        cardHeaderColorTheme = "bg-mainblack";
        textHeaderColorTheme = "text-whiteSmoke";
        loginBtnColorTheme = "bg-mainblack";
        formColorTheme = "bg-whitesmoke";
        cardBorderThemeColor = "border-secondary";
    }
    else {
        cardColorTheme = "bg-peach-65";
        cardHeaderColorTheme = "bg-warning-subtle";
        textHeaderColorTheme = "text-viridian-green";
        loginBtnColorTheme = "bg-viridian-green";
        formColorTheme = "";
        cardBorderThemeColor = "";
    }

    return (
        <div>
            {
                currentPage.successAlertBox 
                    ? <SuccessModal modalMessage="Create new user success."></SuccessModal>
                    : <></>
            }

            <LoadingComponent 
                isDarkTheme={isDarkTheme}
                isDisplay={displayLoadingComponent}
            ></LoadingComponent>
            <form 
                className={`card shadow-sm ${cardColorTheme} ${cardBorderThemeColor}`} 
                onSubmit={UserLogin}
            >
                <div className={`card-header d-flex justify-content-between align-items-center ${cardHeaderColorTheme} ${textHeaderColorTheme}`}>
                    {
                        currentPage.backBtn
                            ? <div onClick={backButtonHandler}>
                                <i className="bi bi-caret-left-fill"></i>
                            </div>
                            : <div></div>
                    }
                    <h2 className="m-0 text-center">Login</h2>
                    <div></div>
                </div>
                <div className="card-body m-2">
                    <div className="mb-3">
                        <p className="mb-1">
                            Username:
                        </p>
                        <input className={`form-control w-100 ${formColorTheme} shadow-sm`} name="usernameInput" type="text" min={1} max={20} required/>

                    </div>
                    <div className="mt-3">
                        <p className="mb-1">
                            Password:
                        </p>
                        <input className={`form-control w-100 ${formColorTheme} shadow-sm`} name="passwordInput" type="password" min={1} max={20} required/>
                    </div>
                    <div className="mt-4 text-center">
                        <button 
                            type="submit"
                            className={`btn btn-sm w-100 my-2 ${loginBtnColorTheme} text-white shadow-sm`}
                        >
                            Log In
                        </button>
                        <button
                            className="btn btn-sm btn-outline-secondary w-100 my-4 mt-2 shadow-sm"
                            onClick={() => changeCurrentPage({ page: PwaCurrentPageEnum.Register })}
                        >
                            Sign Up
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}