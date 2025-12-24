import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-[var(--bg-color)] p-4">
                    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-8 max-w-md text-center shadow-xl">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/10 flex items-center justify-center">
                            <AlertTriangle size={32} className="text-rose-500" />
                        </div>
                        <h2 className="text-xl font-black text-[var(--text-primary)] mb-2">
                            خطایی رخ داد
                        </h2>
                        <p className="text-[var(--text-muted)] text-sm mb-6">
                            متأسفانه مشکلی در بارگذاری صفحه پیش آمد. لطفاً دوباره تلاش کنید.
                        </p>
                        <button
                            onClick={this.handleRetry}
                            className="flex items-center justify-center gap-2 mx-auto px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                        >
                            <RefreshCw size={18} />
                            <span>تلاش مجدد</span>
                        </button>
                        {this.state.error && (
                            <details className="mt-6 text-left">
                                <summary className="text-xs text-[var(--text-muted)] cursor-pointer">
                                    جزئیات خطا
                                </summary>
                                <pre className="mt-2 p-3 bg-slate-900 text-rose-400 text-xs rounded-xl overflow-auto max-h-32">
                                    {this.state.error.toString()}
                                    {'\n'}
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
