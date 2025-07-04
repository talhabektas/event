// frontend/src/components/chat/SelectMembersModal.tsx
import React, { useState, useEffect } from 'react';

interface Member {
    id: number;
    name: string;
    avatarUrl?: string;
}

interface SelectMembersModalProps {
    isOpen: boolean;
    onClose: () => void;
    members: Member[];
    onStartChat: (selectedMemberIds: number[], numericDMRoomId?: number) => void; // numericDMRoomId olarak düzeltildi ve tipi number oldu
    currentUserId?: number;
    roomName?: string;
    currentUserToken?: string; // Giriş yapmış kullanıcının token'ı için prop
}

const SelectMembersModal: React.FC<SelectMembersModalProps> = ({
    isOpen,
    onClose,
    members,
    onStartChat,
    currentUserId,
    roomName,
    currentUserToken, // Prop olarak alındı
}) => {
    const [selectedMemberIds, setSelectedMemberIds] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(false); // Yüklenme durumu için state

    useEffect(() => {
        // Modal her açıldığında seçimi sıfırla
        if (isOpen) {
            setSelectedMemberIds(new Set());
        }
    }, [isOpen]);

    const handleMemberSelect = (memberId: number) => {
        setSelectedMemberIds((prevSelected) => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(memberId)) {
                newSelected.delete(memberId);
            } else {
                newSelected.add(memberId);
            }
            return newSelected;
        });
    };

    const handleSubmit = async () => { // Fonksiyon async yapıldı
        if (selectedMemberIds.size === 0) return;

        setIsLoading(true); // Yüklenmeyi başlat
        const selectedIdsArray = Array.from(selectedMemberIds);

        if (selectedIdsArray.length === 1) {
            // ---- ÖZEL MESAJ (DM) BAŞLATMA MANTIĞI ----
            const otherUserId = selectedIdsArray[0];
            console.log(`Kullanıcı ID ${otherUserId} ile DM odası backend'den isteniyor... (Token: ${currentUserToken ? 'Mevcut' : 'Yok'})`);

            try {
                const headers: HeadersInit = {
                    'Content-Type': 'application/json',
                };
                // Eğer backend yetkilendirme istiyorsa ve token varsa Authorization header'ını ekle
                if (currentUserToken) {
                    headers['Authorization'] = `Bearer ${currentUserToken}`;
                }

                const response = await fetch(`http://localhost:8082/api/rooms/dm`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({ other_user_id: otherUserId }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: "Sunucudan JSON olmayan bir hata yanıtı alındı." })); // JSON parse hatasını da yakala
                    console.error(
                        `DM odası kullanıcı ${otherUserId} için alınırken backend hatası:`,
                        response.status,
                        response.statusText,
                        errorData
                    );
                    alert(`DM odası oluşturulamadı: ${errorData.error || response.statusText} (Kod: ${response.status})`);
                    setIsLoading(false);
                    return;
                }

                const roomData = await response.json();
                console.log(`Backend'den kullanıcı ${otherUserId} için alınan DM oda verisi:`, roomData);

                if (roomData && roomData.id) {
                    const numericDMRoomId: number = roomData.id;
                    console.log('Alınan Sayısal DM Oda IDsi:', numericDMRoomId);
                    onStartChat(selectedIdsArray, numericDMRoomId);
                    // onClose(); // Başarılı olunca modal'ı kapatmak isteyebilirsin
                } else {
                    console.error('DM odası için backendden sayısal ID alınamadı veya oda verisi eksik.', roomData);
                    alert('DM odası için sayısal ID alınamadı veya oda verisi eksik.');
                }
            } catch (error) {
                console.error(
                    `DM odası kullanıcı ${otherUserId} için alma/oluşturma sırasında genel hata:`,
                    error
                );
                alert('Bir hata oluştu, DM odası alınamadı. Lütfen konsolu kontrol edin.');
            } finally {
                setIsLoading(false); // Yüklenmeyi bitir
            }
        } else if (selectedIdsArray.length > 1) {
            // ---- GRUP SOHBETİ BAŞLATMA MANTIĞI ----
            console.log('Grup sohbeti başlatılıyor, seçilen üye IDleri:', selectedIdsArray);
            try {
                const groupName = `Grup sohbeti (${selectedIdsArray.length + 1} kişi)`;

                const headers: HeadersInit = {
                    'Content-Type': 'application/json',
                };
                if (currentUserToken) {
                    headers['Authorization'] = `Bearer ${currentUserToken}`;
                }

                const response = await fetch(`http://localhost:8082/api/rooms/group-chat`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({
                        name: groupName,
                        member_ids: selectedIdsArray
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: "Sunucudan JSON olmayan bir hata yanıtı alındı." }));
                    console.error('Grup sohbeti oluşturulamadı:', response.status, response.statusText, errorData);
                    alert(`Grup sohbeti oluşturulamadı: ${errorData.error || response.statusText} (Kod: ${response.status})`);
                    setIsLoading(false);
                    return;
                }

                const groupData = await response.json();
                console.log('Backend\'den alınan grup sohbeti verisi:', groupData);

                if (groupData && groupData.id) {
                    onStartChat(selectedIdsArray, groupData.id);
                } else {
                    console.error('Grup sohbeti için backend\'den geçerli ID alınamadı.', groupData);
                    alert('Grup sohbeti için geçerli ID alınamadı.');
                }
            } catch (error) {
                console.error('Grup sohbeti oluşturma hatası:', error);
                alert('Grup sohbeti oluşturulurken bir hata oluştu. Lütfen konsolu kontrol edin.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const filteredMembers = members.filter(member => member.id !== currentUserId);

    if (!isOpen) {
        return null;
    }

    return (
        // JSX KISMI OLDUĞU GİBİ KALACAK, BİR ÖNCEKİ MESAJDAKİ GİBİ
        // ONU TEKRAR YAZMIYORUM KISALIK OLSUN DİYE AMA DEĞİŞMEDİĞİNİ BİL.
        // SADECE YUKARIDAKİ LOGIC KISMINI GÜNCELLEDİM.
        // TAM KODU KULLANMAK İSTİYORSAN, LİNTER HATALARINI DÜZELTTİĞİM
        // BİR ÖNCEKİ CEVABIMDAKİ TAM KOD BLOĞUNU ALABİLİRSİN.
        // ŞİMDİLİK SADECE handleSubmit ve props kısmını güncelledim.

        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
            <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                <div className="mt-3 text-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {roomName ? `${roomName} Odası İçin ` : ''}Sohbet Başlat
                    </h3>
                    <div className="mt-4 px-4 py-3 max-h-60 overflow-y-auto">
                        {filteredMembers.length > 0 ? (
                            <ul className="space-y-2 text-left">
                                {filteredMembers.map((member) => (
                                    <li key={member.id} className="flex items-center p-2 hover:bg-gray-100 rounded-md">
                                        <input
                                            type="checkbox"
                                            id={`member-${member.id}`}
                                            checked={selectedMemberIds.has(member.id)}
                                            onChange={() => handleMemberSelect(member.id)}
                                            className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
                                        />
                                        <label htmlFor={`member-${member.id}`} className="flex items-center cursor-pointer">
                                            {member.avatarUrl ? (
                                                <img src={member.avatarUrl} alt={member.name} className="w-8 h-8 rounded-full mr-2" />
                                            ) : (
                                                <span className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white text-sm mr-2">
                                                    {member.name.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                            <span className="text-sm text-gray-700">{member.name}</span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500">Sohbet başlatmak için başka üye bulunmuyor.</p>
                        )}
                    </div>
                    <div className="items-center px-4 py-3 mt-4 border-t">
                        <button
                            onClick={handleSubmit}
                            disabled={selectedMemberIds.size === 0 || isLoading}
                            className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
                        >
                            {isLoading ? 'Yükleniyor...' : selectedMemberIds.size === 1 ? 'Özel Mesaj Başlat' : selectedMemberIds.size > 1 ? 'Grup Sohbeti Başlat' : 'Sohbet Başlat'}
                        </button>
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="mt-2 px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                        >
                            İptal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SelectMembersModal;