

export const OTPModal = ({ isOpen, onConfirm, onCancel, onChange, otpValue}) => {
    if (!isOpen) return null;

    return(
        <>
            <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{backgroundColor: "rgba(0, 0, 0, 0.5)"}}>
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">2FA Authentication</h5>
                            <button type="button" onClick={onCancel} className="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Enter the One-Time Password from your authentication app.</p>
                            <input
                                type="text"
                                className="form-control"
                                value={otpValue}
                                onChange={onChange}
                                placeholder="One-Time Password"
                            />
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
                            <button type="button" className="btn btn-primary" onClick={onConfirm}>Confirm</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
};