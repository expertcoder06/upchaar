import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { appointments, doctors, healthRecords } from '@/lib/data';
import { Stethoscope, FlaskConical, Hospital, ArrowRight, Video, User, FileText } from 'lucide-react';

export default function DashboardPage() {
    const [formattedAppointments, setFormattedAppointments] = useState([]);

    useEffect(() => {
        setFormattedAppointments(
            appointments.map(appt => ({
                ...appt,
                date: new Date(appt.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
            }))
        );
    }, []);

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">Welcome back!</h1>
                <p className="text-muted-foreground">Here&apos;s a summary of your health dashboard.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
                        <Stethoscope className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{appointments.length}</div>
                        <p className="text-xs text-muted-foreground">in the next 7 days</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available Doctors</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{doctors.filter(d => d.availability === 'Available Today').length}</div>
                        <p className="text-xs text-muted-foreground">available for consultation today</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Health Records</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{healthRecords.length}</div>
                        <p className="text-xs text-muted-foreground">total documents stored</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Virtual Consultations</CardTitle>
                        <Video className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{appointments.filter(a => a.type === 'Virtual').length}</div>
                        <p className="text-xs text-muted-foreground">upcoming virtual appointments</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Upcoming Appointments</CardTitle>
                            <CardDescription>Check your scheduled consultations.</CardDescription>
                        </div>
                        <Button size="sm" asChild>
                            <Link to="#">View All</Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {formattedAppointments.map((appt) => (
                                <div key={appt.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={`https://placehold.co/100x100.png`} data-ai-hint="doctor portrait" />
                                            <AvatarFallback>{appt.doctor.charAt(3).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{appt.doctor}</p>
                                            <p className="text-sm text-muted-foreground">{appt.specialty}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium">{appt.date}, {appt.time}</p>
                                        <Badge variant={appt.type === 'Virtual' ? 'default' : 'outline'} className="mt-1">{appt.type}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Your healthcare shortcuts.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                        <Button variant="outline" className="justify-start gap-2" asChild>
                            <Link to="/doctors"><Stethoscope className="h-4 w-4" />Find a Doctor</Link>
                        </Button>
                        <Button variant="outline" className="justify-start gap-2" asChild>
                            <Link to="/diagnostics"><FlaskConical className="h-4 w-4" />Book a Test</Link>
                        </Button>
                        <Button variant="outline" className="justify-start gap-2" asChild>
                            <Link to="/hospitals"><Hospital className="h-4 w-4" />Search Hospitals</Link>
                        </Button>
                        <Button variant="outline" className="justify-start gap-2" asChild>
                            <Link to="/records"><FileText className="h-4 w-4" />View My Records</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
