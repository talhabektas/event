import React from 'react';
import { Card, Button } from '../components';

const HomePage: React.FC = () => {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Hoş Geldiniz</h1>

            <Card title="Etkinlik Yönetim Sistemi" className="mb-6">
                <p className="mb-4">
                    Bu uygulama etkinliklerinizi yönetmenizi sağlar. Etkinlik oluşturabilir, düzenleyebilir ve silebilirsiniz.
                </p>
                <div className="flex space-x-4">
                    <Button>Etkinlikleri Görüntüle</Button>
                    <Button variant="secondary">Daha Fazla Bilgi</Button>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card title="Etkinlik Oluştur">
                    <p className="mb-4">Yeni bir etkinlik oluşturmak için tıklayın.</p>
                    <Button variant="success">Yeni Etkinlik</Button>
                </Card>

                <Card title="Etkinlikleri Yönet">
                    <p className="mb-4">Mevcut etkinliklerinizi düzenleyin veya silin.</p>
                    <Button>Yönet</Button>
                </Card>

                <Card title="İstatistikler">
                    <p className="mb-4">Etkinlik istatistiklerinizi görüntüleyin.</p>
                    <Button variant="secondary">İstatistikleri Gör</Button>
                </Card>
            </div>
        </div>
    );
};

export default HomePage; 