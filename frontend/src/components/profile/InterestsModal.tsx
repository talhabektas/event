import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../../components/ui/dialog"
import Button from "../../components/common/Button"
import InterestSelector from "./InterestSelector"
import { useState } from "react"
import { useAuth } from "../../contexts/AuthContext"

interface Interest {
    id: number;
    name: string;
    category: string;
}

interface InterestsModalProps {
    children: React.ReactNode;
    onSave: (interests: Interest[]) => Promise<void>;
}

export function InterestsModal({ children, onSave }: InterestsModalProps) {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedInterests, setSelectedInterests] = useState<Interest[]>(user?.interests || []);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            // Artık tip dönüşümüne gerek yok, doğrudan Interest[] gönderiyoruz.
            await onSave(selectedInterests);
            setIsOpen(false); // Kaydetme başarılı olunca modalı kapat
        } catch (error) {
            // Hata yönetimi burada veya onSave içinde yapılabilir.
            // Şimdilik sadece logluyoruz.
            console.error("İlgi alanları kaydedilirken hata:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Modal açıldığında kullanıcının en güncel ilgi alanlarını yükle
    const handleOpenChange = (open: boolean) => {
        if (open) {
            setSelectedInterests(user?.interests || []);
        }
        setIsOpen(open);
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>İlgi Alanlarını Düzenle</DialogTitle>
                    <DialogDescription>
                        Size daha uygun etkinlikler ve arkadaşlar önerebilmemiz için ilgi alanlarınızı seçin.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <InterestSelector
                        initialInterests={selectedInterests}
                        onChange={(interests) => setSelectedInterests(interests)}
                    />
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                        İptal
                    </Button>
                    <Button onClick={handleSave} disabled={isSubmitting}>
                        {isSubmitting ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 