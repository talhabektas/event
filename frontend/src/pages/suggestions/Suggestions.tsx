import { useEffect, useState, useCallback } from 'react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';

// Puter.js'in global 'puter' nesnesini kullanabilmek için window'u genişletiyoruz
declare global {
    interface Window {
        puter: any;
    }
}

interface UserSuggestion {
    ID: number;
    SuggestionText: string;
}

const Suggestions = () => {
    const { user: authUser } = useAuth();
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getSuggestionsFromAI = useCallback(async () => {
        const currentInterests = authUser?.interests || [];
        if (currentInterests.length === 0) {
            setError('Öneri oluşturmak için lütfen profilinizden en az bir ilgi alanı seçin.');
            return;
        }
        if (!window.puter) {
            setError('Puter.js kütüphanesi yüklenemedi.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuggestions([]);

        try {
            // Önce backend'deki eski önerileri temizle
            try {
                await apiService.delete('/api/users/me/suggestions');
            } catch (deleteError) {
                console.warn('Eski öneriler silinemedi, devam ediliyor:', deleteError);
            }

            const prompt = `Lütfen aşağıdaki ilgi alanlarına sahip bir kullanıcı için 5 adet etkinlik veya hobi önerisi oluştur. Önerileri kısa ve net bir şekilde, sadece liste halinde ver.

İlgi Alanları: ${currentInterests.map((i: any) => i.name).join(', ')}

Örnek Çıktı:
1. Yeni bir programlama dili öğrenmek
2. Bir sonraki teknoloji konferansına katılmak
3. Lokal bir spor takımının maçına gitmek
4. Canlı müzik etkinliği bulmak
5. Açık kaynaklı bir projeye katkıda bulunmak`;

            console.log('AI\'ya gönderilen prompt:', prompt);
            const response = await window.puter.ai.chat(prompt);
            const aiContent = response?.message?.content;
            console.log('AI\'dan gelen yanıt:', aiContent);

            if (aiContent) {
                const suggestionList = aiContent
                    .split('\n')
                    .map((s: string) => s.replace(/^\d+\.\s*/, '').trim())
                    .filter((s: string) => s.length > 0);
                setSuggestions(suggestionList);
                // Save these new suggestions to the backend
                await apiService.post('/api/users/me/suggestions', { suggestions: suggestionList });
            } else {
                throw new Error("Yapay zeka yanıtı beklenen formatta değil veya boş.");
            }
        } catch (err) {
            console.error('Öneri alınırken hata:', err);
            setError('Yapay zekadan öneri alınırken bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setIsLoading(false);
        }
    }, [authUser]);

    const fetchSuggestions = useCallback(async () => {
        if (!authUser) return;
        setIsLoading(true);
        setError(null);
        try {
            const storedSuggestions = await apiService.get<UserSuggestion[]>('/api/users/me/suggestions');
            if (storedSuggestions && storedSuggestions.length > 0) {
                setSuggestions(storedSuggestions.map(s => s.SuggestionText));
            } else {
                // If no suggestions are stored, generate new ones inline
                const currentInterests = authUser?.interests || [];
                if (currentInterests.length === 0) {
                    setError('Öneri oluşturmak için lütfen profilinizden en az bir ilgi alanı seçin.');
                    return;
                }
                if (!window.puter) {
                    setError('Puter.js kütüphanesi yüklenemedi.');
                    return;
                }

                try {
                    const prompt = `Lütfen aşağıdaki ilgi alanlarına sahip bir kullanıcı için 5 adet etkinlik veya hobi önerisi oluştur. Önerileri kısa ve net bir şekilde, sadece liste halinde ver.

İlgi Alanları: ${currentInterests.map((i: any) => i.name).join(', ')}

Örnek Çıktı:
1. Yeni bir programlama dili öğrenmek
2. Bir sonraki teknoloji konferansına katılmak
3. Lokal bir spor takımının maçına gitmek
4. Canlı müzik etkinliği bulmak
5. Açık kaynaklı bir projeye katkıda bulunmak`;

                    console.log('AI\'ya gönderilen prompt:', prompt);
                    const response = await window.puter.ai.chat(prompt);
                    const aiContent = response?.message?.content;
                    console.log('AI\'dan gelen yanıt:', aiContent);

                    if (aiContent) {
                        const suggestionList = aiContent
                            .split('\n')
                            .map((s: string) => s.replace(/^\d+\.\s*/, '').trim())
                            .filter((s: string) => s.length > 0);
                        setSuggestions(suggestionList);
                        // Save these new suggestions to the backend
                        await apiService.post('/api/users/me/suggestions', { suggestions: suggestionList });
                    } else {
                        throw new Error("Yapay zeka yanıtı beklenen formatta değil veya boş.");
                    }
                } catch (aiError) {
                    console.error('AI öneri alınırken hata:', aiError);
                    setError('Yapay zekadan öneri alınırken bir hata oluştu. Lütfen tekrar deneyin.');
                }
            }
        } catch (error) {
            console.error("Kaydedilmiş öneriler alınırken hata:", error);
            setError('Öneriler alınırken bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setIsLoading(false);
        }
    }, [authUser]);

    // Sadece sayfa ilk yüklendiğinde çalış
    useEffect(() => {
        if (authUser) {
            fetchSuggestions();
        }
    }, [authUser?.id]);

    return (
        <div className="bg-white rounded-lg shadow p-4">
            <p className="text-muted-foreground mb-4 text-sm">İlgi alanlarına göre yapay zeka tarafından oluşturuldu.</p>
            {(authUser?.interests || []).length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 pb-4">
                    {(authUser?.interests || []).map((interest: any) => (
                        <span key={interest.id} className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm">
                            {interest.name}
                        </span>
                    ))}
                </div>
            )}

            {isLoading && (
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-4 text-muted-foreground">Öneriler oluşturuluyor...</span>
                </div>
            )}
            {error && (
                <div className="text-red-500 p-4 bg-red-100 border border-red-400 rounded-md">
                    {error}
                </div>
            )}
            {!isLoading && !error && (
                <div className="space-y-4">
                    <ul className="list-disc pl-5 space-y-2">
                        {suggestions.map((suggestion, index) => (
                            <li key={index} className="text-base">{suggestion}</li>
                        ))}
                    </ul>
                    <Button onClick={getSuggestionsFromAI} disabled={isLoading} className="mt-6">
                        <Loader2 className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : 'hidden'}`} />
                        Yeni Öneriler Getir
                    </Button>
                </div>
            )}
        </div>
    );
};

export default Suggestions;