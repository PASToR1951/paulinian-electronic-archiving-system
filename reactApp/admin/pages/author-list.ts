import React, { useState, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit, HelpCircle, Trash2, Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { fetchAuthors, fetchAuthorById, fetchDocumentsByAuthor } from '../../src/api';
import { toast } from "@/components/ui/use-toast"

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
    document_count?: number;
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
    const [editedName, setEditedName] = useState(author.name);
    const [editedPicture, setEditedPicture] = useState(author.profilePicture);
    const [editedDepartment, setEditedDepartment] = useState(author.department);
    const [editedAffiliation, setEditedAffiliation] = useState(author.affiliation);
    const [editedOrcid, setEditedOrcid] = useState(author.orcid);
    const [editedBiography, setEditedBiography] = useState(author.biography);
    const [editedGender, setEditedGender] = useState(author.gender);
    const [editedEmail, setEditedEmail] = useState(author.email);
    const [localAuthor, setLocalAuthor] = useState(author);
    const [editedId, setEditedId] = useState(author.id);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        setLocalAuthor(author);
        setEditedName(author.name);
        setEditedPicture(author.profilePicture);
        setEditedDepartment(author.department);
        setEditedAffiliation(author.affiliation);
        setEditedOrcid(author.orcid);
        setEditedBiography(author.biography);
        setEditedGender(author.gender);
        setEditedEmail(author.email);
        setEditedId(author.id);
    }, [author]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updatedAuthor: Author = {
                id: editedId,
                name: editedName,
                department: editedDepartment,
                affiliation: editedAffiliation,
                orcid: editedOrcid,
                biography: editedBiography,
                profilePicture: editedPicture,
                gender: editedGender,
                email: editedEmail,
                document_count: author.document_count
            };
            
            // Here you would typically make an API call to update the author
            // For now, we'll just update the local state
            onUpdate(updatedAuthor);
            setLocalAuthor(updatedAuthor);
            setOpen(false);
            toast({
                title: "Author updated",
                description: "The author information has been successfully updated.",
                variant: "default",
            });
        } catch (error) {
            console.error('Error updating author:', error);
            toast({
                title: "Error updating author",
                description: "There was a problem updating the author information. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this author? This action cannot be undone.')) {
            return;
        }
        
        setIsDeleting(true);
        try {
            // Here you would typically make an API call to delete the author
            // For now, we'll just call the onDelete function
            onDelete(author.id);
            toast({
                title: "Author deleted",
                description: "The author has been successfully deleted.",
                variant: "default",
            });
        } catch (error) {
            console.error('Error deleting author:', error);
            toast({
                title: "Error deleting author",
                description: "There was a problem deleting the author. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleOrcidChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatOrcid(e.target.value);
        setEditedOrcid(formatted);
    }, []);

    const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase(); // Ensure uppercase
        const validFormat = /^SPUD-[0-9]{9}-[MF]$/.test(value);
        if (validFormat || value === "") { // allow empty input
            setEditedId(value);
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
                                src={localAuthor.profilePicture}
                                alt={localAuthor.name}
                                className="border-green-500/50"
                                onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = `https://placehold.co/100x100/EEE/31343C?text=${localAuthor.name.substring(0, 2).toUpperCase()}&font=Montserrat`;
                                }}
                            />
                            <AvatarFallback className="bg-green-500 text-white">
                                {localAuthor.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                                {localAuthor.name}
                            </CardTitle>
                            <CardDescription className="text-gray-500 text-sm">
                                <span className="inline-block text-xs font-medium text-green-500 bg-green-100/50 px-1.5 py-0.5 rounded-full mb-1">
                                    {localAuthor.id}
                                </span>
                                {localAuthor.department && <div className="truncate"> {localAuthor.department}</div>}
                                {localAuthor.affiliation && <div className="truncate"> {localAuthor.affiliation}</div>}
                                {localAuthor.document_count !== undefined && (
                                    <div className="text-xs text-gray-500 mt-1">
                                        Documents: {localAuthor.document_count}
                                    </div>
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
                                                value={editedId}
                                                onChange={(e) => handleIdChange(e)}
                                                placeholder="SPUD-XXXXXXXXX-M/F"
                                                className="bg-gray-100 border-gray-300 text-gray-900"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-gray-700">Name</Label>
                                            <Input
                                                id="name"
                                                placeholder="Name"
                                                value={editedName}
                                                onChange={(e) => setEditedName(e.target.value)}
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
                                                                ORCID: Open Researcher and Contributor ID. A persistent digital identifier for researchers.  (According to {' '}
                                                                <a href="https://libguides.library.curtin.edu.au/referencing/apa-7th-edition" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                                                                    Curtin University Library
                                                                </a>
                                                                {').'}
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </Label>
                                            <Input
                                                id="orcid"
                                                placeholder="ORCID"
                                                value={editedOrcid}
                                                onChange={handleOrcidChange}
                                                className="bg-gray-100 border-gray-300 text-gray-900"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="department" className="text-gray-700">Department</Label>
                                            <select
                                                id="department"
                                                value={editedDepartment}
                                                onChange={(e) => setEditedDepartment(e.target.value)}
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
                                                value={editedAffiliation}
                                                onChange={(e) => setEditedAffiliation(e.target.value)}
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
                                                value={editedPicture}
                                                onChange={(e) => setEditedPicture(e.target.value)}
                                                className="bg-gray-100 border-gray-300 text-gray-900"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="gender" className="text-gray-700">Gender</Label>
                                            <select
                                                id="gender"
                                                value={editedGender}
                                                onChange={(e) => setEditedGender(e.target.value as 'M' | 'F')}
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
                                                value={editedEmail}
                                                onChange={(e) => setEditedEmail(e.target.value)}
                                                className="bg-gray-100 border-gray-300 text-gray-900"
                                            />
                                        </div>
                                        <div className="space-y-2 col-span-full">
                                            <Label htmlFor="biography" className="text-gray-700">Biography</Label>
                                            <Textarea
                                                id="biography"
                                                placeholder="Biography"
                                                value={editedBiography}
                                                onChange={(e) => setEditedBiography(e.target.value)}
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
                                        onClick={() => setOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="bg-green-500 text-white hover:bg-green-600"
                                        onClick={handleSave}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            'Save'
                                        )}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        <Button
                            variant="outline"
                            className="text-red-600 bg-red-100/50 hover:bg-red-200/50 hover:text-red-700 flex items-center gap-2 px-2 py-1"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                            <span className="text-xs">Delete</span>
                        </Button>
                    </div>
                </CardHeader>
            </Card>
        </div>
    );
};

const AuthorList: React.FC<{ authors: Author[]; onUpdateAuthor: (updatedAuthor: Author) => void; onDeleteAuthor: (id: string) => void }> = ({ authors, onUpdateAuthor, onDeleteAuthor }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {authors.map((author) => (
                <AuthorCard
                    key={author.id}
                    author={author}
                    onUpdate={(updatedAuthor) => onUpdateAuthor(updatedAuthor)}
                    onDelete={(id) => onDeleteAuthor(id)}
                />
            ))}
        </div>
    );
};

const AuthorListPage = () => {
    const [authors, setAuthors] = useState<Author[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAuthorsData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchAuthors();
            setAuthors(data);
        } catch (err) {
            console.error('Error fetching authors:', err);
            setError('Failed to load authors. Please try again later.');
            toast({
                title: "Error loading authors",
                description: "There was a problem loading the authors. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuthorsData();
    }, []);

    const handleUpdateAuthor = async (updatedAuthor: Author) => {
        try {
            // Here you would typically make an API call to update the author
            // For now, we'll just update the local state
            setAuthors(authors.map((author) => {
                if (author.id === updatedAuthor.id) {
                    return updatedAuthor;
                }
                return author;
            }));
        } catch (error) {
            console.error('Error updating author:', error);
            toast({
                title: "Error updating author",
                description: "There was a problem updating the author. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleDeleteAuthor = async (id: string) => {
        try {
            // Here you would typically make an API call to delete the author
            // For now, we'll just update the local state
            setAuthors(authors.filter(author => author.id !== id));
        } catch (error) {
            console.error('Error deleting author:', error);
            toast({
                title: "Error deleting author",
                description: "There was a problem deleting the author. Please try again.",
                variant: "destructive",
            });
        }
    };

    const filteredAuthors = authors.filter(author => 
        author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        author.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        author.affiliation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        author.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 bg-green-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                <h1 className="text-3xl font-bold text-green-500 mb-4 md:mb-0">Authors</h1>
                <div className="w-full md:w-64">
                    <Input
                        type="text"
                        placeholder="Search authors..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                    <span className="ml-2 text-gray-600">Loading authors...</span>
                </div>
            ) : error ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline"> {error}</span>
                    <button 
                        className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-4 rounded"
                        onClick={fetchAuthorsData}
                    >
                        Try Again
                    </button>
                </div>
            ) : filteredAuthors.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-gray-500 text-lg">No authors found.</p>
                    {searchTerm && (
                        <p className="text-gray-400 mt-2">Try adjusting your search term.</p>
                    )}
                </div>
            ) : (
                <AuthorList 
                    authors={filteredAuthors} 
                    onUpdateAuthor={handleUpdateAuthor} 
                    onDeleteAuthor={handleDeleteAuthor} 
                />
            )}
        </div>
    );
};

export default AuthorListPage;

//cute ko
