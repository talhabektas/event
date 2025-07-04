import { useState, useEffect } from 'react';
import Button from '../common/Button';
import Card from '../common/Card';
import apiService from '../../services/apiService';

interface Interest {
    id: number;
    name: string;
    category: string;
}

interface InterestSelectorProps {
    initialInterests: Interest[];
    onChange: (interests: Interest[]) => void;
}

const InterestSelector = ({ initialInterests = [], onChange }: InterestSelectorProps) => {
    const [allInterests, setAllInterests] = useState<Interest[]>([]);
    const [selectedInterests, setSelectedInterests] = useState<Interest[]>([]);

    useEffect(() => {
        const fetchInterests = async () => {
            try {
                const interests = await apiService.get<Interest[]>('/api/interests');
                setAllInterests(interests);
            } catch (error) {
                console.error("İlgi alanları yüklenirken hata:", error);
            }
        };
        fetchInterests();
    }, []); // Sadece component yüklendiğinde çalışacak

    useEffect(() => {
        // Dışarıdan gelen initialInterests (artık Interest[]) değiştiğinde, state'i doğrudan ayarla
        if (initialInterests.length !== selectedInterests.length || !initialInterests.every(u => selectedInterests.some(s => s.id === u.id))) {
            setSelectedInterests(initialInterests);
        }
    }, [initialInterests]);

    const toggleInterest = (interest: Interest) => {
        const isSelected = selectedInterests.some(i => i.id === interest.id);

        const newSelectedInterests = isSelected
            ? selectedInterests.filter(i => i.id !== interest.id)
            : [...selectedInterests, interest];

        setSelectedInterests(newSelectedInterests);
        onChange(newSelectedInterests);
    };

    return (
        <Card title="İlgi Alanlarım">
            <p className="text-sm text-muted-foreground mb-4">
                Size daha iyi öneriler sunabilmemiz için ilgi alanlarınızı seçin.
            </p>
            <div className="flex flex-wrap gap-2">
                {allInterests.map((interest) => (
                    <Button
                        key={interest.id}
                        variant={selectedInterests.some(i => i.id === interest.id) ? 'primary' : 'outline'}
                        size="small"
                        onClick={() => toggleInterest(interest)}
                    >
                        {interest.name}
                    </Button>
                ))}
            </div>
        </Card>
    );
};

export default InterestSelector; 