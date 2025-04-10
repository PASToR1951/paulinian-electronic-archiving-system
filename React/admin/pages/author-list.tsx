import React, { useState, useEffect, useCallback } from 'react';
import { fetchAuthors, updateAuthor } from '../../src/api.js';
import { Avatar, AvatarFallback, AvatarImage } from "../../src/Components/ui/avatar.tsx";
import { Button } from "../../src/Components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../src/Components/ui/card.tsx";
import { cn } from "../../src/lib/utils.ts";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../../src/Components/ui/dialog.tsx";
import { Input } from "../../src/Components/ui/input.tsx";
import { Label } from "../../src/Components/ui/label.tsx";
import { Edit, HelpCircle, Trash2 } from "lucide-react";
import { Textarea } from "../../src/components/ui/textarea.tsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../src/Components/ui/tooltip.tsx";

interface Author {
    id: string;
    name: string;
    department: string;
    affiliation: string;
    orcid: string;
    biography: string;
    profilePicture: string;
    gender: 'M' | 'F';
    email: string;
}

const generateSpudId = (gender: 'M' | 'F') => {
    const randomDigits = Math.floor(Math.random() * 1000000000);
    const paddedDigits = String(randomDigits).padStart(9, '0');
    return `SPUD-${paddedDigits}-${gender}`;
};

const validAffiliations = [
    "St. Paul University Manila",
    "St. Paul University Quezon City",
    "St. Paul University at San Miguel",
    "St. Paul University Dumaguete",
    "St. Paul University Iloilo",
    "St. Paul University Surigao",
    "International"
];

const validDepartments = [
    "College of Nursing",
    "College of Business & Information Technology",
    "College of Arts, Sciences & Education",
    "Basic Education"
];

const formatOrcid = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, ''); // Remove non-numeric
    const maxLength = 16;
    const truncatedValue = numericValue.slice(0, maxLength); // Truncate to max length

    let formattedOrcid = '';
    for (let i = 0; i < truncatedValue.length; i++) {
        formattedOrcid += truncatedValue[i];
        if ((i + 1) % 4 === 0 && i + 1 !== truncatedValue.length) {
            formattedOrcid += '-';
        }
    }
    return formattedOrcid;
};

const AuthorCard: React.FC<{ author: Author; onUpdate: (updatedAuthor: Author) => void; onDelete: (id: string) => void }> = ({ author, onUpdate, onDelete }) => {
    const [open, setOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editedAuthor, setEditedAuthor] = useState<Author>(author);

    // Reset edited author when the original author changes
    useEffect(() => {
        setEditedAuthor(author);
    }, [author]);

    const handleSave = () => {
        onUpdate(editedAuthor);
        setOpen(false);
    };

    const handleOrcidChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatOrcid(e.target.value);
        setEditedAuthor(prev => ({ ...prev, orcid: formatted }));
    }, []);

    const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase();
        const validFormat = /^SPUD-[0-9]{9}-[MF]$/.test(value);
        if (validFormat || value === "") {
            setEditedAuthor(prev => ({ ...prev, id: value }));
        }
    };

    return (
        <div className="relative">
            <Card
                className={cn(
                    "transition-all duration-300",
                    "border-green-200",
                    "bg-white/90 backdrop-blur-md",
                    "border",
                    "shadow-md",
                    "shadow-black/10",
                    "hover:bg-green-100/80 hover:border-green-300 hover:shadow-lg"
                )}
            >
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                        <Avatar className="h-12 w-12 border-2 border-green-500/50">
                            <AvatarImage
                                src={author.profilePicture}
                                alt={author.name}
                                className="border-green-500/50"
                                onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = `https://placehold.co/100x100/EEE/31343C?text=${author.name.substring(0, 2).toUpperCase()}&font=Montserrat`;
                                }}
                            />
                            <AvatarFallback className="bg-green-500 text-white">
                                {author.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                                {author.name}
                            </CardTitle>
                            <CardDescription className="text-gray-500 text-sm">
                                <span className="inline-block text-xs font-medium text-green-500 bg-green-100/50 px-1.5 py-0.5 rounded-full mb-1">
                                    {author.id}
                                </span>
                                {author.department && <span className="block truncate">{author.department}</span>}
                                {author.affiliation && <span className="block truncate">{author.affiliation}</span>}
                                {author.email && <span className="block truncate text-blue-600">{author.email}</span>}
                                {author.orcid && (
                                    <span className="block truncate text-purple-600">
                                        ORCID: {author.orcid}
                                    </span>
                                )}
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="text-gray-700 bg-green-100/50 hover:bg-green-200/50 hover:text-green-600 flex items-center gap-2 px-2 py-1"
                                >
                                    <Edit className="h-4 w-4" />
                                    <span className="text-xs">Edit</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-white text-gray-900 border-gray-200 max-w-2xl sm:max-w-3xl">
                                <DialogHeader>
                                    <DialogTitle className="text-lg text-green-500">Edit Author</DialogTitle>
                                    <DialogDescription className="text-gray-500">
                                        Make changes to the author&apos;s information below.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2 pb-4">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="id" className="text-gray-700">ID</Label>
                                            <Input
                                                id="id"
                                                value={editedAuthor.id}
                                                onChange={handleIdChange}
                                                placeholder="SPUD-XXXXXXXXX-M/F"
                                                className="bg-gray-100 border-gray-300 text-gray-900"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-gray-700">Name</Label>
                                            <Input
                                                id="name"
                                                placeholder="Name"
                                                value={editedAuthor.name}
                                                onChange={(e) => setEditedAuthor(prev => ({ ...prev, name: e.target.value }))}
                                                className="bg-gray-100 border-gray-300 text-gray-900"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="orcid" className="text-gray-700 flex items-center gap-1">
                                                ORCID
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <HelpCircle className="h-4 w-4 text-gray-500 cursor-pointer" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>
                                                                ORCID: Open Researcher and Contributor ID. A persistent digital identifier for researchers.
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </Label>
                                            <Input
                                                id="orcid"
                                                placeholder="ORCID"
                                                value={editedAuthor.orcid}
                                                onChange={handleOrcidChange}
                                                className="bg-gray-100 border-gray-300 text-gray-900"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="department" className="text-gray-700">Department</Label>
                                            <select
                                                id="department"
                                                value={editedAuthor.department}
                                                onChange={(e) => setEditedAuthor(prev => ({ ...prev, department: e.target.value }))}
                                                className="bg-gray-100 border-gray-300 text-gray-900 rounded-md px-3 py-2 w-full"
                                            >
                                                <option value="">Select Department</option>
                                                {validDepartments.map(dept => (
                                                    <option key={dept} value={dept}>{dept}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="affiliation" className="text-gray-700">Affiliation</Label>
                                            <select
                                                id="affiliation"
                                                value={editedAuthor.affiliation}
                                                onChange={(e) => setEditedAuthor(prev => ({ ...prev, affiliation: e.target.value }))}
                                                className="bg-gray-100 border-gray-300 text-gray-900 rounded-md px-3 py-2 w-full"
                                            >
                                                <option value="">Select Affiliation</option>
                                                {validAffiliations.map(aff => (
                                                    <option key={aff} value={aff}>{aff}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="picture" className="text-gray-700">Profile Picture URL</Label>
                                            <Input
                                                id="picture"
                                                placeholder="Profile Picture URL"
                                                value={editedAuthor.profilePicture}
                                                onChange={(e) => setEditedAuthor(prev => ({ ...prev, profilePicture: e.target.value }))}
                                                className="bg-gray-100 border-gray-300 text-gray-900"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="gender" className="text-gray-700">Gender</Label>
                                            <select
                                                id="gender"
                                                value={editedAuthor.gender}
                                                onChange={(e) => setEditedAuthor(prev => ({ ...prev, gender: e.target.value as 'M' | 'F' }))}
                                                className="bg-gray-100 border-gray-300 text-gray-900 rounded-md px-3 py-2 w-full"
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="M">Male</option>
                                                <option value="F">Female</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-gray-700">Email</Label>
                                            <Input
                                                id="email"
                                                placeholder="Email"
                                                value={editedAuthor.email}
                                                onChange={(e) => setEditedAuthor(prev => ({ ...prev, email: e.target.value }))}
                                                className="bg-gray-100 border-gray-300 text-gray-900"
                                            />
                                        </div>
                                        <div className="space-y-2 col-span-full">
                                            <Label htmlFor="biography" className="text-gray-700">Biography</Label>
                                            <Textarea
                                                id="biography"
                                                placeholder="Biography"
                                                value={editedAuthor.biography}
                                                onChange={(e) => setEditedAuthor(prev => ({ ...prev, biography: e.target.value }))}
                                                className="bg-gray-100 border-gray-300 text-gray-900 min-h-[150px]"
                                                rows={4}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        className="bg-gray-200 text-gray-700 border-gray-300 hover:bg-gray-300 hover:text-gray-900"
                                        onClick={() => {
                                            setEditedAuthor(author); // Reset to original on cancel
                                            setOpen(false);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="bg-green-500 text-white hover:bg-green-600"
                                        onClick={handleSave}
                                    >
                                        Save
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} className="hidden">
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="text-red-600 bg-red-100/50 hover:bg-red-200/50 hover:text-red-700 flex items-center gap-2 px-2 py-1 hidden"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="text-xs">Delete</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-white text-gray-900 border-gray-200">
                                <DialogHeader>
                                    <DialogTitle className="text-lg text-red-500">Delete Author</DialogTitle>
                                    <DialogDescription className="text-gray-500">
                                        Are you sure you want to delete this author? This action cannot be undone.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                    <p className="text-gray-700">
                                        You are about to delete <span className="font-semibold">{author.name}</span> ({author.id}).
                                    </p>
                                </div>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        className="bg-gray-200 text-gray-700 border-gray-300 hover:bg-gray-300 hover:text-gray-900"
                                        onClick={() => setDeleteDialogOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="bg-red-500 text-white hover:bg-red-600"
                                        onClick={() => {
                                            onDelete(author.id);
                                            setDeleteDialogOpen(false);
                                        }}
                                    >
                                        Delete
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Biography</h4>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                            {author.biography || 'No biography available.'}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const AuthorList: React.FC<{ authors: Author[]; onUpdateAuthor: (updatedAuthor: Author) => void; onDeleteAuthor: (id: string) => void }> = ({ authors, onUpdateAuthor, onDeleteAuthor }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(6);
    const [filterDepartment, setFilterDepartment] = useState('');
    const [filterAffiliation, setFilterAffiliation] = useState('');

    // Filter authors based on search term and filters
    const filteredAuthors = authors.filter(author => {
        // Safely check if properties exist before accessing them
        const name = author.name || '';
        const id = author.id || '';
        const email = author.email || '';
        
        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesDepartment = !filterDepartment || author.department === filterDepartment;
        const matchesAffiliation = !filterAffiliation || author.affiliation === filterAffiliation;

        return matchesSearch && matchesDepartment && matchesAffiliation;
    });

    // Calculate pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentAuthors = filteredAuthors.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredAuthors.length / itemsPerPage);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex-1 w-full sm:max-w-md">
                    <Input
                        type="search"
                        placeholder="Search authors..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <select
                        className="px-3 py-2 border rounded-md text-sm"
                        value={filterDepartment}
                        onChange={(e) => setFilterDepartment(e.target.value)}
                    >
                        <option value="">All Departments</option>
                        {validDepartments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                    <select
                        className="px-3 py-2 border rounded-md text-sm"
                        value={filterAffiliation}
                        onChange={(e) => setFilterAffiliation(e.target.value)}
                    >
                        <option value="">All Affiliations</option>
                        {validAffiliations.map(aff => (
                            <option key={aff} value={aff}>{aff}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentAuthors.map((author) => (
                    <AuthorCard 
                        key={author.id} 
                        author={author} 
                        onUpdate={onUpdateAuthor}
                        onDelete={onDeleteAuthor}
                    />
                ))}
            </div>

            {filteredAuthors.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-gray-500">No authors found matching your criteria.</p>
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    <Button
                        variant="outline"
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => (
                        <Button
                            key={i + 1}
                            variant={currentPage === i + 1 ? "default" : "outline"}
                            onClick={() => paginate(i + 1)}
                        >
                            {i + 1}
                        </Button>
                    ))}
                    <Button
                        variant="outline"
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
};

const AuthorListPage = () => {
    const [authors, setAuthors] = useState<Author[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadAuthors = async () => {
            try {
                setLoading(true);
                const data = await fetchAuthors();
                setAuthors(data);
                setError(null);
            } catch (err) {
                console.error('Failed to load authors:', err);
                setError('Failed to load authors. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        loadAuthors();
    }, []);

    const handleUpdateAuthor = async (updatedAuthor: Author) => {
        try {
            console.log('Updating author:', updatedAuthor);
            
            // First update in the database
            await updateAuthor(updatedAuthor.id, updatedAuthor);
            
            // If database update successful, update local state
            setAuthors(prevAuthors => {
                return prevAuthors.map(author => {
                    if (author.id === updatedAuthor.id) {
                        console.log('Found matching author:', author.id);
                        return updatedAuthor;
                    }
                    console.log('Skipping non-matching author:', author.id);
                    return author;
                });
            });
        } catch (error) {
            console.error('Failed to update author:', error);
            // You might want to show an error message to the user here
            setError('Failed to update author. Please try again later.');
        }
    };

    const handleDeleteAuthor = (id: string) => {
        console.log('Deleting author:', id);
        setAuthors(prevAuthors => prevAuthors.filter(author => author.id !== id));
    };

    if (loading) {
        return (
            <div className="p-6 bg-green-50 min-h-screen">
                <div className="max-w-[1200px] mx-auto">
                    <h1 className="text-3xl font-bold mb-8 text-green-500">Authors</h1>
                    <div className="text-center">Loading authors...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-green-50 min-h-screen">
                <div className="max-w-[1200px] mx-auto">
                    <h1 className="text-3xl font-bold mb-8 text-green-500">Authors</h1>
                    <div className="text-center text-red-500">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-green-50 min-h-screen">
            <div className="max-w-[1200px] mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-green-500">Authors</h1>
                <AuthorList 
                    authors={authors} 
                    onUpdateAuthor={handleUpdateAuthor}
                    onDeleteAuthor={handleDeleteAuthor}
                />
            </div>
        </div>
    );
};

export default AuthorListPage;

//cute ko
