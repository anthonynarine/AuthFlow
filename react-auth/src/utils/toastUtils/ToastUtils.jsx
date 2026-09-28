import { Bounce, Zoom, toast } from "react-toastify";

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
            background: "var(--color-toast-bg)", // Background color for the success toast
            color: "var(--color-accent)",      // Text color for the success toast
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
            background: "var(--color-toast-bg)", // Background color for the error toast
            color: "var(--color-toast-error)",      // Text color for the error toast
        }
    });
};
