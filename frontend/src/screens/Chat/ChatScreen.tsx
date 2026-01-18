import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { 
    MdSend, 
    MdAttachFile, 
    MdArrowBack, 
    MdSearch,
    MdPerson,
    MdChat, // For MessageCircle replacement
    MdCheck,
    MdDoneAll,
    MdDescription,
    MdClose,
    MdRefresh // For loading
} from 'react-icons/md';

interface ChatUser {
    id: number;
    username: string;
    role: string;
    unread_count: number;
}

interface Message {
    message_id: number;
    sender_employee_id: number;
    message_type: 'text' | 'image' | 'pdf' | 'doc';
    message_text: string; // URL if file, text otherwise
    created_at: string;
    is_read: number;
    is_sender: boolean;
}

const API_BASE_URL = 'https://prospine.in/admin/mobile/api';
const FILE_BASE_URL = 'https://prospine.in/';

const ChatScreen: React.FC = () => {
    const { user } = useAuthStore();
    const [users, setUsers] = useState<ChatUser[]>([]);
    const [activeUser, setActiveUser] = useState<ChatUser | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const location = useLocation();
    const { id } = useParams();
    const navigate = useNavigate();

    // Initial load
    useEffect(() => {
        fetchUsers();
        // Poll users list for unread counts every 15s
        const interval = setInterval(fetchUsers, 15000);
        return () => clearInterval(interval);
    }, []);

    // Handle deep link (Notification or URL Param)
    useEffect(() => {
        // 1. From Notification State
        const state = location.state as { targetUserId?: number };
        if (state?.targetUserId) {
            navigate(`/chat/${state.targetUserId}`, { replace: true, state: {} });
            return;
        }

        // 2. From URL Param
        if (id) {
            const userId = parseInt(id);
            if (!isNaN(userId) && users.length > 0) {
                 const target = users.find(u => u.id === userId);
                 if (target) setActiveUser(target);
            }
        } else {
            setActiveUser(null);
        }
    }, [id, users, location.state, navigate]);

    // Poll messages when chat is active
    useEffect(() => {
        if (!activeUser) return;
        
        fetchMessages(activeUser.id);
        const interval = setInterval(() => {
            fetchMessages(activeUser.id, true); // true = silent (no loading spinner)
        }, 3000); // Poll every 3s

        return () => clearInterval(interval);
    }, [activeUser]);

    // Scroll to bottom on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchUsers = async () => {
        try {
            const params = new URLSearchParams();
            const empId = user?.employee_id || (user as any)?.id;
            if (empId) params.append('employee_id', empId.toString());
            const branchId = user?.branch_id || 1;
            params.append('branch_id', branchId.toString());
            params.append('action', 'users');

            const res = await fetch(`${API_BASE_URL}/chat.php?${params.toString()}`);
            const data = await res.json();
            if (data.success && data.users) {
                setUsers(data.users);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchMessages = async (partnerId: number, silent = false) => {
        if (!silent) setIsLoadingMessages(true);
        try {
            const params = new URLSearchParams();
            const empId = user?.employee_id || (user as any)?.id;
            if (empId) params.append('employee_id', empId.toString());
            const branchId = user?.branch_id || 1;
            params.append('branch_id', branchId.toString());
            params.append('action', 'fetch');
            params.append('partner_id', partnerId.toString());

            const res = await fetch(`${API_BASE_URL}/chat.php?${params.toString()}`);
            const data = await res.json();
            if (data.success && data.messages) {
                setMessages(data.messages);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            if (!silent) setIsLoadingMessages(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && activeUser) {
            const file = e.target.files[0];
            setIsUploading(true);
            const formData = new FormData();
            
            const empId = user?.employee_id || (user as any)?.id;
            if (empId) formData.append('employee_id', empId.toString());
            const branchId = user?.branch_id || 1;
            formData.append('branch_id', branchId.toString());
            
            formData.append('action', 'send');
            formData.append('receiver_id', activeUser.id.toString());
            formData.append('file', file);
            
            try {
                await fetch(`${API_BASE_URL}/chat.php`, {
                    method: 'POST',
                    body: formData,
                });
                fetchMessages(activeUser.id);
            } catch (error) {
                console.error('Error uploading file:', error);
                alert('Upload failed');
            } finally {
                setIsUploading(false);
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSendMessage = async () => {
        if ((!inputText.trim()) || !activeUser) return;

        const textToSend = inputText;
        setInputText(''); // Optimistic clear

        try {
            const formData = new FormData();
            const empId = user?.employee_id || (user as any)?.id;
            if (empId) formData.append('employee_id', empId.toString());
            const branchId = user?.branch_id || 1;
            formData.append('branch_id', branchId.toString());
            formData.append('action', 'send');
            formData.append('receiver_id', activeUser.id.toString());
            formData.append('message_text', textToSend);

            const res = await fetch(`${API_BASE_URL}/chat.php`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                fetchMessages(activeUser.id, true);
            } else {
                alert('Failed to send: ' + data.message);
                setInputText(textToSend); // Restore text
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setInputText(textToSend); // Restore text
        }
    };

    // Base path for navigation
    const basePath = location.pathname.startsWith('/admin') ? '/admin/chat' : '/chat';

    const handleBackToList = () => {
        navigate(basePath);
        setMessages([]);
        fetchUsers();
    };

    const filteredUsers = users.filter(u => 
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Render Message Bubble
    const renderMessage = (msg: Message) => {
        const isMe = msg.is_sender;
        
        // Format time
        const date = new Date(msg.created_at); // Already ISO from API
        const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
            <div key={msg.message_id} className={`flex w-full mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-[20px] px-4 py-3 shadow-sm relative group ${
                    isMe 
                    ? 'bg-primary text-on-primary rounded-br-none' 
                    : 'bg-surface-variant/50 dark:bg-gray-800 text-on-surface dark:text-gray-100 rounded-bl-none border border-outline-variant/10 dark:border-gray-700'
                }`}>
                    {/* Content */}
                    {msg.message_type === 'text' && (
                        <p className={`text-sm md:text-base leading-relaxed break-words font-normal ${isMe ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>
                            {msg.message_text}
                        </p>
                    )}
                    {msg.message_type === 'image' && (
                        <div 
                            className="rounded-lg overflow-hidden mb-1 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setSelectedImage(`${FILE_BASE_URL}${msg.message_text}`)}
                        >
                             <img src={`${FILE_BASE_URL}${msg.message_text}`} alt="Shared" className="max-w-full h-auto object-cover" />
                        </div>
                    )}
                    {(msg.message_type === 'pdf' || msg.message_type === 'doc') && (
                        <a href={`${FILE_BASE_URL}${msg.message_text}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white/10 p-2 rounded hover:bg-white/20 transition-colors">
                            <MdDescription size={20} />
                            <span className="text-sm underline truncate max-w-[150px]">Attachment</span>
                        </a>
                    )}

                    {/* Meta */}
                    <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-primary-container' : 'text-outline dark:text-gray-500'}`}>
                        <span>{time}</span>
                        {isMe && (
                            msg.is_read ? <MdDoneAll size={14} className="text-white" /> : <MdCheck size={14} />
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // --- VIEW: User List ---
    if (!activeUser) {
        return (
            <div className="flex flex-col h-full bg-surface dark:bg-gray-950 pb-[env(safe-area-inset-bottom)] relative">
                {/* Primary Gradient Background Mesh */}
                <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/30 via-primary/5 to-transparent pointer-events-none z-0 dark:from-primary/10" />
                
                {/* Header */}
                <div className="bg-transparent backdrop-blur-xl px-5 py-4 pt-[max(env(safe-area-inset-top),20px)] sticky top-0 z-30 transition-colors duration-200">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-bold font-poppins text-on-surface dark:text-white tracking-tight">Chats</h1>
                        <div className="p-2 bg-secondary-container dark:bg-teal-900/20 rounded-full">
                            <MdChat size={20} className="text-on-secondary-container dark:text-teal-400" />
                        </div>
                    </div>
                    {/* Search */}
                    <div className="relative">
                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-outline dark:text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search colleagues..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-surface-variant/30 dark:bg-gray-800 text-on-surface dark:text-white pl-10 pr-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium placeholder-outline dark:placeholder-gray-500"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3 pb-24 custom-scrollbar">
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map(u => (
                            <button
                                key={u.id}
                                onClick={() => navigate(`${basePath}/${u.id}`)}
                                className="w-full bg-surface dark:bg-gray-900 p-4 rounded-[20px] shadow-sm border border-outline-variant/10 dark:border-gray-800 flex items-center gap-4 hover:bg-surface-variant/20 dark:hover:bg-gray-800 transition-all active:scale-[0.98] group"
                            >
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-2xl bg-primary-container dark:bg-primary/20 flex items-center justify-center text-on-primary-container dark:text-primary-container font-bold text-lg shadow-sm">
                                        {u.username.charAt(0).toUpperCase()}
                                    </div>
                                    {/* Online indicator (simulated for now) */}
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-surface dark:bg-gray-900 rounded-full flex items-center justify-center">
                                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                                    </div>
                                </div>
                                <div className="flex-1 text-left overflow-hidden">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-medium text-on-surface dark:text-white text-base truncate">{u.username}</h3>
                                        <span className="text-[10px] text-on-surface-variant dark:text-gray-400 font-medium bg-surface-variant/50 dark:bg-gray-800 px-2 py-0.5 rounded-md border border-outline-variant/10 dark:border-gray-700">{u.role}</span>
                                    </div>
                                    <p className="text-xs text-outline dark:text-gray-500 truncate">Tap to chat</p>
                                </div>
                                {u.unread_count > 0 && (
                                    <div className="w-6 h-6 rounded-full bg-error flex items-center justify-center text-white text-xs font-bold shadow-md shadow-error/30 animate-pulse">
                                        {u.unread_count}
                                    </div>
                                )}
                            </button>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-outline/50 dark:text-gray-600">
                             <MdPerson size={48} className="mb-2 opacity-50" />
                             <p className="text-sm font-medium">No colleagues found</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- VIEW: Active Chat ---
    return (
        <div className="flex flex-col h-full bg-surface dark:bg-gray-950 pb-[env(safe-area-inset-bottom)]">
            {/* Chat Header */}
            <div className="bg-surface/90 dark:bg-gray-900/90 backdrop-blur-md px-4 py-3 pt-[max(env(safe-area-inset-top),16px)] sticky top-0 z-30 border-b border-outline-variant/10 dark:border-gray-800 shadow-sm flex items-center justify-between transition-colors duration-200">
                <div className="flex items-center gap-3">
                    <button onClick={handleBackToList} className="p-2 -ml-2 rounded-full hover:bg-surface-variant/50 dark:hover:bg-gray-800 transition-colors">
                        <MdArrowBack size={24} className="text-on-surface dark:text-gray-200" />
                    </button>
                    <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-primary-container dark:bg-primary/20 flex items-center justify-center text-on-primary-container dark:text-primary-container font-bold text-sm shadow-sm">
                            {activeUser.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="font-medium text-on-surface dark:text-white text-sm leading-tight">{activeUser.username}</h2>
                            <p className="text-[10px] text-outline dark:text-gray-400 capitalize">{activeUser.role}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-surface-variant/20 dark:bg-gray-950" style={{ backgroundImage: 'radial-gradient(circle at center, var(--tw-gradient-stops))', opacity: 1 }}>
                {/* Subtle pattern overlay */}
                <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" 
                     style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")` }}>
                </div>

                {isLoadingMessages && messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    messages.length > 0 ? (
                        <div className="relative z-10 space-y-1">
                            {messages.map(renderMessage)}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full opacity-40">
                            <MdChat size={64} className="text-outline mb-4" />
                            <p className="text-on-surface-variant text-sm">Start a conversation with {activeUser.username}</p>
                        </div>
                    )
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-surface dark:bg-gray-900 border-t border-outline-variant/10 dark:border-gray-800 pb-[max(env(safe-area-inset-bottom),12px)] relative z-20">
                <div className="flex items-end gap-2 max-w-4xl mx-auto">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileSelect}
                        accept="image/*,.pdf,.doc,.docx"
                    />
                    <button 
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="p-3 text-on-surface-variant/70 hover:text-primary bg-surface-variant/30 dark:bg-gray-800 rounded-full hover:bg-primary-container/30 transition-all disabled:opacity-50"
                    >
                        {isUploading ? <MdRefresh size={24} className="animate-spin text-primary" /> : <MdAttachFile size={24} />}
                    </button>
                    <div className="flex-1 bg-surface-variant/30 dark:bg-gray-800 rounded-[24px] flex items-center px-4 py-2 focus-within:ring-2 focus-within:ring-primary/30 transition-all border border-transparent focus-within:border-primary/20">
                        <textarea 
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Type a message..."
                            className="bg-transparent border-none focus:ring-0 w-full text-sm max-h-32 resize-none py-2 text-on-surface dark:text-white placeholder-outline dark:placeholder-gray-500"
                            rows={1}
                            style={{ minHeight: '40px' }}
                        />
                    </div>
                    <button 
                        onClick={handleSendMessage} 
                        disabled={!inputText.trim()}
                        className="p-3 bg-primary text-on-primary rounded-full shadow-lg shadow-primary/30 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none disabled:hover:scale-100"
                    >
                        <MdSend size={20} className="ml-0.5" />
                    </button>
                </div>
            </div>
            
            {/* Image Modal */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setSelectedImage(null)}
                >
                    <button className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
                        <MdClose size={24} />
                    </button>
                    <img 
                        src={selectedImage || ''} 
                        alt="Full size" 
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-scale-in"
                    />
                </div>
            )}
        </div>
    );
};

export default ChatScreen;
