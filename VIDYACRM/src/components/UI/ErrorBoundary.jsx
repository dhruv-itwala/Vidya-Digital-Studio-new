import React from "react";
import { FiAlertTriangle, FiRefreshCw, FiHome } from "react-icons/fi";
import styles from "./ErrorBoundary.module.css";

class ErrorBoundaryClass extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("Uncaught runtime error in component tree:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          resetError: this.handleRetry,
        });
      }

      return (
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.iconWrapper}>
              <FiAlertTriangle />
            </div>

            <h2 className={styles.title}>Something went wrong</h2>
            <p className={styles.message}>
              An unexpected error occurred while rendering this section. You can try refreshing the component or return to the dashboard.
            </p>

            {this.state.error?.message && (
              <div className={styles.errorBox}>
                {this.state.error.toString()}
              </div>
            )}

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={this.handleRetry}
              >
                <FiRefreshCw /> Try Again
              </button>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={this.handleGoHome}
              >
                <FiHome /> Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundaryClass;
