import { Bounce, Flip, Slide, Zoom, toast } from "react-toastify";

export const showSuccessToast = (message) => {
    toast.success(message, {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Zoom,
        closeButton: false, 
        style: {
            background: "#1C2833", // Background color for the success toast
            color: "#1ABC9C",      // Text color for the success toast
        }
    });
};

export const showErrorToast = (errorMessage) => {
    toast.error(errorMessage, {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
        closeButton: false, 
        style: {
            background: "#1C2833", // Background color for the error toast
            color: "#DC3545",      // Text color for the error toast
        }
    });
};
