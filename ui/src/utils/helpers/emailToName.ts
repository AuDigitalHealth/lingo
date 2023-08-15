

export default function emailToName(email: string | undefined) {
    if(email === undefined) return '';

    const [namePart, domainPart] = email.split('@');
    const [firstname, lastname] = namePart.split('.');

    const capitalizedFirstname = firstname?.charAt(0)?.toUpperCase() + firstname?.slice(1);
    const capitalizedLastname = lastname?.charAt(0)?.toUpperCase() + lastname?.slice(1);

    const transformedName = `${capitalizedFirstname} ${capitalizedLastname}`;

    return transformedName;
}