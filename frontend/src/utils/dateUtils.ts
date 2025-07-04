export const formatDate = (dateString?: string | null): string => {
    if (!dateString) return 'Belirtilmemiş';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Geçersiz Tarih';
    return date.toLocaleDateString('tr-TR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

export const formatTime = (dateString?: string | null): string => {
    if (!dateString) return 'Belirtilmemiş';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Geçersiz Tarih';
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
};

// İleride başka tarih/zaman formatlama fonksiyonları buraya eklenebilir. 