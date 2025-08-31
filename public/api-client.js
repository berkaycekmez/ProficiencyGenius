/**
 * Bu dosya, frontend'in backend'imizdeki /api/gemini adresiyle konuşmasını sağlar.
 * Artık tarayıcı doğrudan Google ile konuşmaz, bizim sunucumuzla konuşur.
 */
async function callApi(methodName, ...args) {
    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ methodName, args }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'Bilinmeyen bir sunucu hatası.' }));
            throw new Error(err.error);
        }
        return response.json();
    } catch (error) {
        console.error(`API çağrısı '${methodName}' başarısız:`, error);
        // Quota hatasını yakalamak için özel kontrol
        if (error.message.includes('QUOTA_EXCEEDED')) {
            const quotaError = new Error('QUOTA_EXCEEDED');
            quotaError.isQuotaError = true;
            throw quotaError;
        }
        throw error;
    }
}