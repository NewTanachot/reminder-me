import { PwaCurrentPage } from "@/model/enumModel";
import { ISettingProps } from "@/model/propsModel";
import StaticSettingCard from "../settingPageAsset/staticSettingCard";
import ThemeSettingCard from "../settingPageAsset/themeSettingCard";

export default function Setting({ currentUserName, changeCurrentPage, changeThemeHandler, isDarkTheme }: ISettingProps) {
    return (
        <div className="card shadow-sm bg-peach-65">
            <div className="card-body m-2">

                {/* user info */}
                <StaticSettingCard
                    cardIcon="bi bi-person-square"
                    cardTitle="UserName"
                    cardInfo={currentUserName}
                ></StaticSettingCard>

                {/* theme */}
                <ThemeSettingCard
                    changeCurrentThemeHandler={changeThemeHandler}
                    isDarkTheme={isDarkTheme}
                ></ThemeSettingCard>

                <div className="mt-4 text-center">
                    <button
                        className="btn btn-sm btn-outline-secondary w-100 my-4 mt-2"
                        onClick={() => changeCurrentPage(PwaCurrentPage.Login)}
                    >
                        Sign out
                    </button>
                </div>
            </div>
        </div>
    )
}