// components/ReceiptScanner.js

window.ReceiptScanner = function ReceiptScanner({ uid }) {
    const { useState, useRef, useEffect } = React;

    const [status, setStatus] = useState("IDLE"); // IDLE, CAMERA, SCANNING, RESULT
    const [stream, setStream] = useState(null);
    const [imageSrc, setImageSrc] = useState(null);

    // Extracted Data States
    const [extractedAmount, setExtractedAmount] = useState("");
    const [extractedCategory, setExtractedCategory] = useState("Pagkain");
    const [saving, setSaving] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // Turn off camera when component unmounts
    useEffect(() => {
        return () => stopCamera();
    }, []);

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" } // Use back camera if available
            });
            setStream(mediaStream);
            setStatus("CAMERA");
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera access denied or error:", err);
            Swal.fire({ icon: 'error', title: 'Camera Error', text: 'Hindi ma-access ang iyong camera. Paki-check ang permissions.', confirmButtonColor: '#B5483B', customClass: { popup: 'tipid-swal' }});
        }
    };

    // Attach stream to video element when it renders
    useEffect(() => {
        if (status === "CAMERA" && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.error("Play error:", e));
        }
    }, [status, stream]);

    const captureImage = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Match canvas size to video frame
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imgDataUrl = canvas.toDataURL('image/jpeg');
        setImageSrc(imgDataUrl);
        stopCamera();
        processImageMock(imgDataUrl);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setImageSrc(event.target.result);
            processImageMock(event.target.result);
        };
        reader.readAsDataURL(file);
    };

    const processImageMock = (base64Image) => {
        setStatus("SCANNING");

        // Simulating an API Call to Gemini Vision or Google Cloud Vision
        setTimeout(() => {
            // Mock extracted data
            const mockAmounts = ["245.50", "1120.00", "85.00", "3450.75", "150.00"];
            const mockCategories = ["Pagkain", "Bills", "Pamasahe", "Iba pa"];

            const randomAmt = mockAmounts[Math.floor(Math.random() * mockAmounts.length)];
            const randomCat = mockCategories[Math.floor(Math.random() * mockCategories.length)];

            setExtractedAmount(randomAmt);
            setExtractedCategory(randomCat);
            setStatus("RESULT");
        }, 2500); // 2.5 seconds scanning animation
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const amt = parseFloat(extractedAmount);

        if (isNaN(amt) || amt <= 0) {
            return Swal.fire({ icon: 'warning', title: 'Teka muna!', text: 'Paki-check ang halaga.', confirmButtonColor: '#1F6F54', customClass: { popup: 'tipid-swal' }});
        }

        setSaving(true);
        try {
            await window.TipidData.addExpense(uid, {
                desc: "Resibo (Auto-Scanned)",
                amount: amt,
                category: extractedCategory,
                method: "Cash",
                spendType: "need"
            });

            // Removed sparkle emoji from SweetAlert title
            Swal.fire({
                icon: 'success',
                title: 'Nai-log na!',
                text: `Ang resibo na ₱${window.peso(amt)} ay naidagdag na.`,
                confirmButtonColor: '#1F6F54',
                timer: 2000,
                showConfirmButton: false,
                customClass: { popup: 'tipid-swal' }
            });

            // Reset state
            resetScanner();

        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Hindi nai-save. Subukan ulit.', confirmButtonColor: '#B5483B', customClass: { popup: 'tipid-swal' }});
        } finally {
            setSaving(false);
        }
    };

    const resetScanner = () => {
        stopCamera();
        setImageSrc(null);
        setStatus("IDLE");
    };

    return (
        <div className="space-y-6 fade-up">
            <style>{`
                @keyframes scanLine {
                    0% { top: 5%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 95%; opacity: 0; }
                }
                .laser-scan {
                    position: absolute;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: #52C8A1;
                    box-shadow: 0 0 15px 4px rgba(82, 200, 161, 0.6);
                    animation: scanLine 2s linear infinite;
                    z-index: 20;
                }
            `}</style>

            <div className="bg-white/60 dark:bg-ink2/30 backdrop-blur-2xl rounded-[1.75rem] border border-white/60 dark:border-white/10 shadow-ios p-5 sm:p-7 relative overflow-hidden min-h-[450px] flex flex-col">

                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <span className="w-10 h-10 rounded-[14px] bg-peso/10 dark:bg-pesoLight/15 text-peso dark:text-pesoLight flex items-center justify-center shrink-0">
                        <window.Icons.Scan size={18} />
                    </span>
                    <div>
                        <h3 className="font-display text-[1.15rem] font-semibold text-ink dark:text-paper leading-tight">AI Receipt Scanner</h3>
                        <p className="text-[11px] text-ink2/50 dark:text-paper/50">Hayaang AI ang mag-type ng gastos mo</p>
                    </div>
                </div>

                {/* IDLE STATE: Choose Action */}
                {status === "IDLE" && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="w-24 h-24 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-ink2/30 dark:text-paper/30 mb-2">
                            <window.Icons.Scan size={40} />
                        </div>
                        <p className="text-sm font-medium text-ink2/70 dark:text-paper/60 mb-2 max-w-[250px]">
                            Itutok ang camera sa resibo at kukunin namin ang Total Amount at Kategorya.
                        </p>

                        <div className="w-full max-w-[250px] flex flex-col gap-3 mt-4">
                            {/* SVG Camera Icon replaces Emoji */}
                            <button onClick={startCamera} className="w-full bg-gradient-to-r from-peso to-pesoLight text-white py-3.5 rounded-2xl font-semibold shadow-md active:scale-95 transition-all flex items-center justify-center gap-2">
                                <window.Icons.Camera size={18} /> Buksan ang Camera
                            </button>

                            <div className="relative w-full">
                                <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                {/* SVG Image Icon replaces Plus icon */}
                                <button className="w-full bg-black/5 dark:bg-white/5 text-ink dark:text-paper py-3.5 rounded-2xl font-medium active:scale-95 transition-all flex items-center justify-center gap-2">
                                    <window.Icons.Image size={18} /> Mag-upload ng Larawan
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* CAMERA STATE: Viewfinder */}
                {status === "CAMERA" && (
                    <div className="flex-1 flex flex-col">
                        <div className="relative flex-1 bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                            <video ref={videoRef} playsInline autoPlay className="w-full h-full object-cover"></video>

                            {/* Viewfinder overlay */}
                            <div className="absolute inset-4 border-2 border-white/40 border-dashed rounded-xl pointer-events-none"></div>

                            <button onClick={resetScanner} className="absolute top-4 right-4 bg-black/40 backdrop-blur text-white p-2 rounded-full hover:bg-black/60 transition">
                                <window.Icons.X size={20} />
                            </button>
                        </div>

                        <div className="pt-6 pb-2 flex justify-center">
                            <button onClick={captureImage} className="w-16 h-16 rounded-full bg-white border-4 border-peso shadow-lg active:scale-90 transition-transform"></button>
                        </div>

                        <canvas ref={canvasRef} className="hidden"></canvas>
                    </div>
                )}

                {/* SCANNING STATE: Animation */}
                {status === "SCANNING" && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="relative w-full max-w-[300px] aspect-[3/4] bg-black rounded-2xl overflow-hidden shadow-xl mb-6 ring-4 ring-peso/20">
                            <img src={imageSrc} alt="Captured receipt" className="w-full h-full object-cover opacity-60 grayscale" />
                            <div className="laser-scan"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-white font-mono text-sm tracking-widest flex items-center gap-2">
                                    <window.Icons.Loader size={16} className="spin" /> EXTRACTING...
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* RESULT STATE: Form pre-filled */}
                {status === "RESULT" && (
                    <div className="flex-1 flex flex-col">
                        <div className="flex items-start gap-4 mb-6 bg-peso/10 dark:bg-pesoLight/10 border border-peso/20 p-4 rounded-[1.25rem]">
                            <img src={imageSrc} alt="Thumb" className="w-16 h-20 object-cover rounded-lg shadow-sm" />
                            <div>
                                <p className="text-xs font-bold text-peso dark:text-pesoLight uppercase tracking-wider mb-1">OCR Success</p>
                                <p className="text-sm text-ink dark:text-paper font-medium mb-1">Na-detect ang mga detalye mula sa resibo.</p>
                                <p className="text-[10px] text-ink2/60 dark:text-paper/60">Paki-verify ang halaga kung tama bago i-save.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSave} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-mono font-semibold uppercase tracking-widest text-ink2/60 dark:text-paper/50 pl-1">Extracted Amount</label>
                                <div className="flex items-center gap-2.5 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[14px] px-3.5 py-3.5 focus-within:ring-2 focus-within:ring-peso/40 transition-all">
                                    <span className="text-ink2/40 dark:text-paper/40 font-mono text-[16px] shrink-0">₱</span>
                                    <input type="number" step="0.01" value={extractedAmount} onChange={e => setExtractedAmount(e.target.value)} className="w-full bg-transparent font-mono text-xl font-bold text-ink dark:text-paper focus:outline-none" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-mono font-semibold uppercase tracking-widest text-ink2/60 dark:text-paper/50 pl-1">Suggested Category</label>
                                <div className="flex items-center gap-2.5 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[14px] px-3.5 py-3.5 focus-within:ring-2 focus-within:ring-peso/40 transition-all relative">
                                    <window.Icons.Category size={16} className="text-ink2/40 dark:text-paper/40 shrink-0" />
                                    <select value={extractedCategory} onChange={e => setExtractedCategory(e.target.value)} className="w-full bg-transparent text-[14px] text-ink dark:text-paper focus:outline-none appearance-none pr-4">
                                        {window.CATEGORIES.map(c => <option key={c} value={c} className="bg-paper dark:bg-ink">{c}</option>)}
                                    </select>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute right-4 text-ink2/30 dark:text-paper/30 pointer-events-none"><path d="M6 9l6 6 6-6" /></svg>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-4">
                                <button type="button" onClick={resetScanner} className="flex-1 bg-black/5 dark:bg-white/5 text-ink dark:text-paper py-4 rounded-[14px] font-semibold text-[14px] active:scale-95 transition-all">
                                    Ulitin
                                </button>
                                <button type="submit" disabled={saving} className="flex-[2] bg-gradient-to-r from-peso to-pesoLight text-white py-4 rounded-[14px] font-bold text-[15px] shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                                    {saving ? <window.Icons.Loader size={18} className="spin" /> : <window.Icons.Check size={18} />}
                                    I-save bilang Gastos
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};
