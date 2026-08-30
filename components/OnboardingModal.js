// components/OnboardingModal.js

window.OnboardingModal = function OnboardingModal({ uid, onComplete }) {
    const { useState, useEffect } = React;

    const [step, setStep] = useState(0);
    const [isExiting, setIsExiting] = useState(false);

    const steps = [
        {
            eyebrow: "WELCOME TO TIPID",
            title: "Mabuhay, Ka-Tipid!",
            desc: "Ang Tipid ay isang simple at personal na money companion na ginawa para tulungan kang mas maayos na bantayan, planuhin, at gamitin ang iyong pera araw-araw.",
            mascot: "/assets/tipid_mascot.png",
            accent: "from-peso/30 to-pesoLight/10",
            badgeColor: "bg-peso/10 text-peso dark:text-pesoLight",
            highlight: "Your Personal Money Companion",
            icon: "wallet"
        },
        {
            eyebrow: "UNDERSTAND YOUR MONEY",
            title: "Alamin Kung Saan Napupunta ang Pera",
            desc: "I-record ang iyong kita, gastos, at bayarin para makita mo kung magkano ang pumapasok, magkano ang lumalabas, at kung magkano ang natitira sa iyo.",
            mascot: "/assets/allowance_mascot.png",
            accent: "from-gold/30 to-gold/10",
            badgeColor: "bg-gold/10 text-gold",
            highlight: "Track Income & Expenses",
            icon: "chart"
        },
        {
            eyebrow: "BUDGET SMARTER",
            title: "Matutong Mag-budget",
            desc: "Magtakda ng spending limit para sa iyong buwanang budget at bantayan ang iyong progress. Mas madaling umiwas sa overspending kapag alam mo kung nasaan ka.",
            mascot: "/assets/tipid_mascot.png",
            accent: "from-pesoLight/30 to-peso/10",
            badgeColor: "bg-pesoLight/10 text-peso",
            highlight: "Stay Within Your Budget",
            icon: "target"
        },
        {
            eyebrow: "SAVE WITH PURPOSE",
            title: "Mag-ipon Para sa Iyong Goals",
            desc: "May gustong bilhin? Emergency fund? Pangarap na gadget? Gumawa ng savings goal at subaybayan kung gaano ka na kalapit sa target mo.",
            mascot: "/assets/tipid_mascot.png",
            accent: "from-emerald-500/25 to-emerald-400/10",
            badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            highlight: "Turn Goals Into Progress",
            icon: "piggybank"
        },
        {
            eyebrow: "EVERYDAY MONEY TOOLS",
            title: "Mas Madaling Magplano",
            desc: "Gamitin ang Smart Palengke para sa grocery planning at Hulugan Tracker para bantayan ang iyong installments, hulugan, at iba pang regular na bayarin.",
            mascot: "/assets/bills_mascot.png",
            accent: "from-blue-500/25 to-blue-400/10",
            badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
            highlight: "Everything in One Place",
            icon: "receipt"
        },
        {
            eyebrow: "YOU'RE READY",
            title: "Simulan ang Iyong Tipid Journey!",
            desc: "Hindi kailangan maging expert sa finances para magsimula. Simulan sa maliit, maging consistent, at hayaan ang Tipid na tumulong sa iyo na magkaroon ng mas magandang money habits.",
            mascot: "/assets/tipid_mascot.png",
            accent: "from-peso/30 to-emerald-400/20",
            badgeColor: "bg-peso/10 text-peso dark:text-pesoLight",
            highlight: "Simple. Practical. Made for You.",
            icon: "sparkles"
        }
    ];

    /*
    |--------------------------------------------------------------------------
    | SVG ICON SYSTEM
    |--------------------------------------------------------------------------
    */

    const Icon = ({ name, size = 18, strokeWidth = 2 }) => {
        const common = {
            width: size,
            height: size,
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: strokeWidth,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            "aria-hidden": "true"
        };

        const icons = {

            /*
            |--------------------------------------------------------------------------
            | WALLET
            |--------------------------------------------------------------------------
            */

            wallet: (
                <svg {...common}>
                    <path d="M20 7V6a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v8a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V7" />
                    <path d="M16 13h.01" />
                </svg>
            ),

            /*
            |--------------------------------------------------------------------------
            | CHART
            |--------------------------------------------------------------------------
            */

            chart: (
                <svg {...common}>
                    <path d="M3 3v18h18" />
                    <path d="m7 16 4-5 3 3 5-7" />
                </svg>
            ),

            /*
            |--------------------------------------------------------------------------
            | TARGET
            |--------------------------------------------------------------------------
            */

            target: (
                <svg {...common}>
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="5" />
                    <circle cx="12" cy="12" r="1.5" />
                </svg>
            ),

            /*
            |--------------------------------------------------------------------------
            | PIGGY BANK
            |--------------------------------------------------------------------------
            */

            piggybank: (
                <svg {...common}>
                    <path d="M19 8.5c.6.7 1 1.6 1 2.5v2a4 4 0 0 1-4 4H9a6 6 0 0 1-6-6V9a5 5 0 0 1 5-5h5c2.5 0 4.7 1.2 6 3" />
                    <path d="M7 18v2" />
                    <path d="M16 18v2" />
                    <path d="M20 11h2v3h-2" />
                    <path d="M7 9h.01" />
                    <path d="M15 7V5a2 2 0 0 1 2-2h1" />
                </svg>
            ),

            /*
            |--------------------------------------------------------------------------
            | RECEIPT
            |--------------------------------------------------------------------------
            */

            receipt: (
                <svg {...common}>
                    <path d="M4 2v20l3-2 3 2 2-2 3 2 3-2 2 2V2l-2 2-3-2-3 2-3-2-3 2Z" />
                    <path d="M8 9h8" />
                    <path d="M8 13h6" />
                    <path d="M8 17h4" />
                </svg>
            ),

            /*
            |--------------------------------------------------------------------------
            | SPARKLES
            |--------------------------------------------------------------------------
            */

            sparkles: (
                <svg {...common}>
                    <path d="m12 3-1.2 3.6L7 8l3.8 1.4L12 13l1.2-3.6L17 8l-3.8-1.4L12 3Z" />
                    <path d="m19 13-.7 2.3L16 16l2.3.7L19 19l.7-2.3L22 16l-2.3-.7L19 13Z" />
                    <path d="m5 14-.6 1.9L2.5 16.5l1.9.6L5 19l.6-1.9 1.9-.6-1.9-.6L5 14Z" />
                </svg>
            )
        };

        return icons[name] || icons.wallet;
    };


    /*
    |--------------------------------------------------------------------------
    | FINISH ONBOARDING
    |--------------------------------------------------------------------------
    */

    const finishOnboarding = () => {

        if (isExiting) return;

        setIsExiting(true);

        setTimeout(() => {

            localStorage.setItem(
                `tipid_onboarded_${uid}`,
                "true"
            );

            if (onComplete) {
                onComplete();
            }

        }, 350);
    };


    /*
    |--------------------------------------------------------------------------
    | NEXT
    |--------------------------------------------------------------------------
    */

    const handleNext = () => {

        if (step < steps.length - 1) {

            setStep(prev => prev + 1);

        } else {

            finishOnboarding();

        }
    };


    /*
    |--------------------------------------------------------------------------
    | BACK
    |--------------------------------------------------------------------------
    */

    const handleBack = () => {

        if (step > 0) {

            setStep(prev => prev - 1);

        }
    };


    /*
    |--------------------------------------------------------------------------
    | KEYBOARD NAVIGATION
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        const handleKeyDown = (e) => {

            if (e.key === "ArrowRight") {
                handleNext();
            }

            if (e.key === "ArrowLeft") {
                handleBack();
            }

            if (e.key === "Escape") {
                finishOnboarding();
            }

        };

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {

            window.removeEventListener(
                "keydown",
                handleKeyDown
            );

        };

    }, [step, isExiting]);


    /*
    |--------------------------------------------------------------------------
    | CURRENT STEP
    |--------------------------------------------------------------------------
    */

    const currentStep = steps[step];


    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (

        <div
            className={`
                fixed inset-0 z-50
                flex items-center justify-center
                p-4 sm:p-6

                bg-ink/80
                dark:bg-black/90

                backdrop-blur-xl

                transition-opacity
                duration-300

                ${isExiting
                    ? "opacity-0"
                    : "opacity-100"
                }
            `}
        >

            {/* ============================================================
                MAIN MODAL
            ============================================================ */}

            <div
                className={`
                    relative
                    overflow-hidden

                    w-full
                    max-w-lg

                    bg-white
                    dark:bg-ink2

                    rounded-[2.5rem]

                    border
                    border-white/20
                    dark:border-white/10

                    shadow-[0_32px_80px_rgba(0,0,0,0.30)]

                    p-6
                    sm:p-10

                    text-center

                    transition-all
                    duration-300

                    ${isExiting
                        ? "scale-95 translate-y-4"
                        : "scale-100 translate-y-0"
                    }
                `}
            >

                {/* ========================================================
                    DECORATIVE BACKGROUND GLOW
                ======================================================== */}

                <div
                    className={`
                        pointer-events-none
                        absolute
                        -top-32
                        -right-32

                        w-64
                        h-64

                        rounded-full

                        bg-gradient-to-br
                        ${currentStep.accent}

                        blur-3xl
                        opacity-60
                    `}
                />

                <div
                    className={`
                        pointer-events-none
                        absolute
                        -bottom-32
                        -left-32

                        w-64
                        h-64

                        rounded-full

                        bg-gradient-to-tr
                        ${currentStep.accent}

                        blur-3xl
                        opacity-40
                    `}
                />


                {/* ========================================================
                    SKIP BUTTON
                ======================================================== */}

                <div className="absolute top-5 right-6 z-30">

                    <button
                        onClick={finishOnboarding}
                        type="button"
                        className="
                            text-xs
                            font-semibold

                            text-ink2/50
                            dark:text-paper/40

                            hover:text-ink
                            dark:hover:text-paper

                            tracking-wider
                            uppercase

                            transition-all

                            px-3.5
                            py-1.5

                            rounded-full

                            hover:bg-black/5
                            dark:hover:bg-white/5
                        "
                    >
                        Laktawan
                    </button>

                </div>


                {/* ========================================================
                    PROGRESS INDICATORS
                ======================================================== */}

                <div
                    className="
                        relative
                        z-10

                        flex
                        justify-center
                        gap-1.5

                        mb-7
                        pt-2
                        px-6
                    "
                >

                    {steps.map((_, i) => (

                        <button
                            key={i}
                            type="button"
                            onClick={() => setStep(i)}
                            aria-label={`Pumunta sa step ${i + 1}`}
                            className="
                                flex-1
                                h-1.5

                                bg-black/10
                                dark:bg-white/10

                                rounded-full

                                overflow-hidden

                                cursor-pointer

                                focus:outline-none
                                focus:ring-2
                                focus:ring-peso/30
                            "
                        >

                            <div
                                className={`
                                    h-full

                                    bg-gradient-to-r
                                    from-peso
                                    to-pesoLight

                                    rounded-full

                                    transition-all
                                    duration-500
                                    ease-out

                                    ${i <= step
                                        ? "w-full"
                                        : "w-0"
                                    }
                                `}
                            />

                        </button>

                    ))}

                </div>


                {/* ========================================================
                    MASCOT AREA
                ======================================================== */}

                <div
                    className="
                        relative

                        w-36
                        h-36

                        sm:w-44
                        sm:h-44

                        mx-auto
                        mb-5

                        flex
                        items-center
                        justify-center
                    "
                >

                    {/* Mascot Glow */}

                    <div
                        className={`
                            absolute
                            inset-0

                            bg-gradient-to-br
                            ${currentStep.accent}

                            rounded-full

                            blur-3xl

                            animate-pulse
                        `}
                    />


                    {/* ====================================================
                        REAL SVG FEATURE ICON
                    ==================================================== */}

                    <div
                        className="
                            absolute

                            top-0
                            right-0

                            z-20

                            w-10
                            h-10

                            flex
                            items-center
                            justify-center

                            rounded-full

                            bg-white
                            dark:bg-ink

                            shadow-lg

                            border
                            border-black/5
                            dark:border-white/10

                            text-peso
                            dark:text-pesoLight

                            transition-all
                            duration-300
                        "
                    >

                        <Icon
                            name={currentStep.icon}
                            size={18}
                            strokeWidth={2}
                        />

                    </div>


                    {/* Mascot */}

                    <img
                        key={step}
                        src={currentStep.mascot}
                        alt="Tipid Buddy"

                        onError={(e) => {

                            e.target.onerror = null;

                            e.target.src =
                                "/assets/tipid_mascot.png";

                        }}

                        className="
                            relative
                            z-10

                            w-full
                            h-full

                            object-contain

                            mascot-float-key

                            filter
                            drop-shadow-2xl

                            transition-all
                            duration-500

                            transform
                            scale-100
                        "
                    />

                </div>


                {/* ========================================================
                    BADGE + HIGHLIGHT
                ======================================================== */}

                <div
                    className="
                        relative
                        z-10

                        mb-4

                        flex
                        flex-col
                        items-center

                        gap-2
                    "
                >

                    {/* Eyebrow */}

                    <span
                        className={`
                            inline-block

                            px-3.5
                            py-1

                            rounded-full

                            text-[10px]

                            font-mono
                            font-bold

                            tracking-widest
                            uppercase

                            ${currentStep.badgeColor}
                        `}
                    >
                        {currentStep.eyebrow}
                    </span>


                    {/* Highlight Pill */}

                    <span
                        className="
                            inline-flex
                            items-center
                            gap-1.5

                            text-[11px]

                            font-medium

                            text-peso
                            dark:text-pesoLight

                            bg-peso/5
                            dark:bg-pesoLight/10

                            px-3
                            py-1

                            rounded-full
                        "
                    >

                        <Icon
                            name={currentStep.icon}
                            size={13}
                            strokeWidth={2.3}
                        />

                        {currentStep.highlight}

                    </span>

                </div>


                {/* ========================================================
                    TITLE
                ======================================================== */}

                <h3
                    key={`title-${step}`}
                    className="
                        relative
                        z-10

                        font-display

                        text-2xl
                        sm:text-3xl

                        font-bold

                        text-ink
                        dark:text-paper

                        mb-3

                        tracking-tight

                        transition-all
                        duration-300

                        animate-[fadeIn_0.35s_ease-out]
                    "
                >
                    {currentStep.title}
                </h3>


                {/* ========================================================
                    DESCRIPTION
                ======================================================== */}

                <p
                    key={`desc-${step}`}
                    className="
                        relative
                        z-10

                        text-[13.5px]
                        sm:text-sm

                        text-ink2/70
                        dark:text-paper/70

                        leading-relaxed

                        mb-8

                        px-2
                        sm:px-4

                        min-h-[68px]
                    "
                >
                    {currentStep.desc}
                </p>


                {/* ========================================================
                    STEP COUNTER
                ======================================================== */}

                <div
                    className="
                        relative
                        z-10

                        mb-4

                        text-[11px]

                        font-medium

                        text-ink2/40
                        dark:text-paper/40
                    "
                >
                    {step + 1} / {steps.length}
                </div>


                {/* ========================================================
                    NAVIGATION BUTTONS
                ======================================================== */}

                <div
                    className="
                        relative
                        z-10

                        flex
                        gap-3
                    "
                >

                    {/* BACK */}

                    {step > 0 && (

                        <button
                            onClick={handleBack}
                            type="button"

                            className="
                                flex-1

                                py-4

                                bg-black/5
                                dark:bg-white/10

                                hover:bg-black/10
                                dark:hover:bg-white/15

                                text-ink
                                dark:text-paper

                                rounded-[16px]

                                font-semibold
                                text-sm

                                active:scale-95

                                transition-all
                            "
                        >

                            <span className="inline-flex items-center justify-center gap-2">

                                <svg
                                    width="15"
                                    height="15"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <line
                                        x1="19"
                                        y1="12"
                                        x2="5"
                                        y2="12"
                                    />

                                    <polyline
                                        points="12 19 5 12 12 5"
                                    />
                                </svg>

                                Bumalik

                            </span>

                        </button>

                    )}


                    {/* NEXT / FINISH */}

                    <button
                        onClick={handleNext}
                        type="button"

                        className="
                            flex-[2]

                            py-4

                            bg-gradient-to-r
                            from-peso
                            to-pesoLight

                            hover:shadow-lg
                            hover:shadow-peso/25

                            text-white

                            rounded-[16px]

                            font-bold
                            text-sm

                            shadow-md

                            active:scale-95

                            transition-all

                            flex
                            items-center
                            justify-center
                            gap-2
                        "
                    >

                        {step === steps.length - 1 ? (

                            <>
                                Simulan ang Tipid

                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <line
                                        x1="5"
                                        y1="12"
                                        x2="19"
                                        y2="12"
                                    />

                                    <polyline
                                        points="12 5 19 12 12 19"
                                    />
                                </svg>
                            </>

                        ) : (

                            <>
                                Sunod

                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <polyline
                                        points="9 18 15 12 9 6"
                                    />
                                </svg>
                            </>

                        )}

                    </button>

                </div>

            </div>

        </div>
    );
};
