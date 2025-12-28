import React, { useEffect, useRef, useState } from "react";
import styles from "./Footer.module.css";

export const Footer: React.FC = () => {
    const footerElements = {
        gitHub: "https://github.com/ronik-v",
        email: "andronnikovvv@gmail.com",
        telegram: "https://t.me/vadimAndronik",
    };

    const [showEmail, setShowEmail] = useState(false);
    const [copied, setCopied] = useState(false);
    const timerRef = useRef<number | null>(null);
    const open = (link: string) => window.location.assign(link);

    const onEmailClick = async () => {
        setShowEmail(true);
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(footerElements.email);
                setCopied(true);
            } else {
                setCopied(false);
            }
        } catch {
            setCopied(false);
        }
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => {
            setShowEmail(false);
            setCopied(false);
            timerRef.current = null;
        }, 3000);
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
        };
    }, []);

    return (
        <footer className={styles.footer}>
            <div className={styles.left}>
                <button type="button" className={styles.btn} onClick={() => open(footerElements.gitHub)}>
                    <img className={styles.icon} src="/github-logo-png_seeklogo-480450.png" alt="GitHub" />
                </button>

                <div className={styles.emailWrap}>
                    <button type="button" className={styles.btn} onClick={onEmailClick}>
                        <img className={styles.icon} src="/gmail-new.jpg" alt="Email" />
                    </button>

                    {showEmail && (
                        <div className={styles.tooltip} role="status" aria-live="polite">
                            <span>{footerElements.email}</span>
                            {copied && <span className={styles.copied}> • Скопировано</span>}
                        </div>
                    )}
                </div>

                <button type="button" className={styles.btn} onClick={() => open(footerElements.telegram)}>
                    <img className={styles.icon} src="/telegram-ico.png" alt="Telegram" />
                </button>
            </div>

            <div className={styles.info}>
                <p className={styles.name}>Vadim Andronik</p>
                <p className={styles.year}>© 2025</p>
            </div>
        </footer>
    );
};