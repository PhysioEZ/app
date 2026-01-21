import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { 
    MdSend, 
    MdAttachFile, 
    MdArrowBack, 
    MdSearch,
    MdChat,
    MdCheck,
    MdDoneAll,
    MdMoreVert
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
    message_text: string;
    created_at: string;
    is_read: number;
    is_sender: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';

const DevChatScreen: React.FC = () => {
    const { user } = useAuthStore();
    const [users, setUsers] = useState<ChatUser[]>([]);
    const [activeUser, setActiveUser] = useState<ChatUser | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
        const interval = setInterval(fetchUsers, 15000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (id) {
            const userId = parseInt(id);
            if (!isNaN(userId) && users.length > 0) {
                 const target = users.find(u => u.id === userId);
                 if (target) setActiveUser(target);
            }
        } else {
            setActiveUser(null);
        }
    }, [id, users]);

    useEffect(() => {
        if (!activeUser) return;
        fetchMessages(activeUser.id);
        const interval = setInterval(() => {
            fetchMessages(activeUser.id, true);
        }, 3000);
        return () => clearInterval(interval);
    }, [activeUser]);

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

    const fetchMessages = async (partnerId: number, _silent = false) => {
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
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || !activeUser) return;
        const textToSend = inputText;
        setInputText('');
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
                setInputText(textToSend);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setInputText(textToSend);
        }
    };

    const filteredUsers = users.filter(u => 
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!activeUser) {
        return (
            <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-gray-950 transition-colors duration-500 relative overflow-hidden font-sans">
                
                {/* Direct Teal Gradient Background */}
                <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-[#E0F2F1] via-[#E0F2F1]/50 to-transparent dark:from-teal-900/20 dark:to-transparent pointer-events-none z-0" />
                
                {/* Header */}
                <header className="px-6 py-6 pt-12 flex flex-col gap-6 z-30 relative">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-light text-gray-900 dark:text-white tracking-tight">Comms</h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Team Coordination</p>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <MdChat size={18} />
                        </div>
                    </div>

                    <div className="relative">
                        <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Find colleague..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/50 dark:bg-zinc-900/50 border border-gray-100 dark:border-white/5 rounded-2xl py-3 pl-11 pr-4 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all dark:text-white backdrop-blur-md placeholder:text-gray-400 shadow-sm"
                        />
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-6 space-y-3 pb-32 relative z-10 no-scrollbar">
                    {filteredUsers.map(u => (
                        <button
                            key={u.id}
                            onClick={() => navigate(`/dev/chat/${u.id}`)}
                            className="w-full bg-white dark:bg-zinc-900/80 border border-gray-100 dark:border-white/5 p-4 rounded-[28px] flex items-center gap-4 active:scale-[0.98] transition-all shadow-sm group hover:border-indigo-500/30"
                        >
                            <div className="relative">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center font-bold text-lg shadow-inner group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                    {u.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center border border-white dark:border-black">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                            <div className="flex-1 text-left">
                                <div className="flex items-center justify-between mb-0.5">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{u.username}</h3>
                                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{u.role}</span>
                                </div>
                                <p className="text-[10px] text-gray-400 font-medium">Click to open channel</p>
                            </div>
                            {u.unread_count > 0 && (
                                <div className="min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-lg shadow-rose-500/20">
                                    {u.unread_count}
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-gray-950 transition-colors duration-500 font-sans relative">
            
            {/* Direct Teal Gradient Background */}
            <div className="absolute top-0 left-0 right-0 h-[100px] bg-gradient-to-b from-[#E0F2F1] via-[#E0F2F1]/50 to-transparent dark:from-teal-900/20 dark:to-transparent pointer-events-none z-0" />

            {/* Chat Header */}
            <div className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl px-4 py-3 pt-12 border-b border-gray-100 dark:border-white/5 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/dev/chat')} className="w-10 h-10 rounded-2xl bg-transparent hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center -ml-2 transition-colors">
                        <MdArrowBack size={20} className="text-gray-500" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-indigo-500/20">
                            {activeUser.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{activeUser.username}</h2>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{activeUser.role}</p>
                        </div>
                    </div>
                </div>
                <button className="w-10 h-10 rounded-2xl flex items-center justify-center text-gray-400 hover:text-indigo-500 transition-colors">
                    <MdMoreVert size={20} />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 no-scrollbar z-10">
                {messages.map((msg) => {
                    const isMe = msg.is_sender;
                    // Format to IST
                    const date = new Date(msg.created_at);
                    const time = date.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        timeZone: 'Asia/Kolkata',
                        hour12: true
                    });

                    return (
                        <div key={msg.message_id} className={`flex w-full animate-fade-in-up ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-[20px] px-4 py-3 shadow-sm relative group ${
                                isMe 
                                ? 'bg-indigo-500 text-white rounded-br-[4px] shadow-indigo-500/20' 
                                : 'bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-200 rounded-bl-[4px] border border-gray-100 dark:border-white/5'
                            }`}>
                                <p className="text-[13px] leading-relaxed break-words font-medium">
                                    {msg.message_text}
                                </p>
                                <div className={`text-[9px] mt-1 flex items-center justify-end gap-1 opacity-60 font-black tracking-tighter ${isMe ? 'text-white' : 'text-gray-400'}`}>
                                    <span>{time}</span>
                                    {isMe && (msg.is_read ? <MdDoneAll size={14} /> : <MdCheck size={14} />)}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Flat Design */}
            <div className="p-4 bg-white dark:bg-zinc-950 border-t border-gray-100 dark:border-white/5 z-20">
                <div className="flex items-end gap-3 max-w-4xl mx-auto">
                    <button className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 text-gray-400 flex items-center justify-center hover:text-indigo-500 transition-all flex-shrink-0">
                        <MdAttachFile size={20} />
                    </button>
                    <div className="flex-1 bg-gray-50 dark:bg-white/5 rounded-2xl px-4 py-2">
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
                            className="bg-transparent border-none focus:ring-0 outline-none w-full text-sm max-h-32 resize-none text-gray-800 dark:text-white placeholder-gray-400 font-medium"
                            rows={1}
                            style={{ minHeight: '24px' }}
                        />
                    </div>
                    <button 
                        onClick={handleSendMessage} 
                        disabled={!inputText.trim()}
                        className="w-10 h-10 bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-500/30 active:scale-90 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center flex-shrink-0"
                    >
                        <MdSend size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DevChatScreen;
