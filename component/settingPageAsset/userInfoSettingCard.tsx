import {IUserInfoSettingCardProps} from "@/model/propsModel"
import {PwaCurrentPageEnum} from "@/model/enumModel";

export default function UserInfoSettingCard({ userInfo, changeCurrentPage, isDarkTheme }: IUserInfoSettingCardProps) {

    const switchUserHandler = () => {
        changeCurrentPage({
            page: PwaCurrentPageEnum.Login,
            backBtn: true
        });
    }

    let cardColorTheme: string;
    let textColorTheme: string;
    let subTextColorTheme: string;
    let switchUserBtnColorTheme: string;

    if (isDarkTheme) {
        cardColorTheme = "bg-subBlack";
        textColorTheme = "text-whiteSmoke";
        subTextColorTheme = "text-milk-orange";
        switchUserBtnColorTheme = "btn-secondary";
    }
    else {
        cardColorTheme = "bg-peach";
        textColorTheme = "text-viridian-green";
        subTextColorTheme = "text-secondary";
        switchUserBtnColorTheme = "bg-viridian-green text-white";
    }

    return (
        <>
            <div className={`card shadow-sm mb-3 ${textColorTheme} ${cardColorTheme}`}>
                <div className="card-body m-2 p-0">
                    <div className="d-flex align-items-center">
                        <div className="flex-shrink-0 ms-2">
                            <i style={{ fontSize: "2rem"}} className="fa-solid fa-user-tie"></i>
                        </div>
                        <div className="flex-grow-1 ms-3">
                            <h6 className="m-0 lh-1">
                                Username:
                                <br />
                                <span className={subTextColorTheme}>
                                {userInfo}
                            </span>
                            </h6>
                        </div>
                        <div>
                            <button
                                className={`btn btn-sm ${switchUserBtnColorTheme}`}
                                onClick={switchUserHandler}
                            >
                                <i className="fa-solid fa-people-arrows"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}