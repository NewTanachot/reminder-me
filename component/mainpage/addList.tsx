export default function AddList() {
    return (
        <div className="card shadow-sm bg-peach-65">
            {/* <div className="card-header bg-warning-subtle text-viridian-green">
                <h2 className="m-0 text-center text-cornflowerblue">Add New Place</h2>
            </div> */}
            <div className="card-body m-2">
                <div className="mb-3">
                    <p className="mb-1">
                        Name:<span className="text-danger">*</span>
                    </p>
                    <input className="form-control w-100" type="text" placeholder="entry place name..." required/>
                    {/* {
                        inputValidator.userNameValidator
                            ? <li className="text-danger text-opacity-75 ms-1">Username is required.</li>
                            : <></>
                    } */}
                </div>
                <div className="mt-3">
                    <p className="mb-1">
                        Reminder Message:
                    </p>
                    <textarea className="form-control w-100" placeholder="entry some message..." rows={2} required/>
                    {/* {
                        inputValidator.passwordValidator
                            ? <li className="text-danger text-opacity-75 ms-1">Password is required.</li>
                            : <></>
                    } */}
                </div>
                <div className="mt-3">
                    <p className="mb-1">
                        Reminder Date:
                    </p>
                    <input className="form-control w-100" type="date" required/>
                    {/* {
                        inputValidator.passwordValidator
                            ? <li className="text-danger text-opacity-75 ms-1">Password is required.</li>
                            : <></>
                    } */}
                </div>
                <div className="mt-3 text-center">
                    <a className="text-cobalt-blue">
                        <i className="bi bi-geo-fill me-2"></i>
                        Mark location
                    </a>
                </div>
                <div className="mt-1">
                    <p className="mb-1">
                        Latitude:<span className="text-danger">*</span>
                    </p>
                    <input className="form-control w-100" type="number" defaultValue={0} step={.01} min={0}/>
                    {/* {
                        inputValidator.passwordValidator
                            ? <li className="text-danger text-opacity-75 ms-1">Password is required.</li>
                            : <></>
                    } */}
                </div>
                <div className="mt-3">
                    <p className="mb-1">
                        Longitude:<span className="text-danger">*</span>
                    </p>
                    <input className="form-control w-100" type="number" defaultValue={0} step={.01} min={0}/>
                    {/* {
                        inputValidator.passwordValidator
                            ? <li className="text-danger text-opacity-75 ms-1">Password is required.</li>
                            : <></>
                    } */}
                </div>
                <div className="mt-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <p className="mb-1">Auto Activate:</p>
                        <div className="form-check form-switch">
                            {
                                <input type="checkbox" 
                                    className="form-check-input" 
                                    defaultChecked={true} 
                                />
                            }
                        </div>
                    </div>
                </div>
                <div className="mt-4 text-center">
                    <button 
                        type="submit"
                        className="btn btn-sm w-100 my-2 bg-viridian-green text-white"
                        // onClick={UserLogin}
                    >
                        Add
                    </button>
                </div>
            </div>
        </div>
    )
}