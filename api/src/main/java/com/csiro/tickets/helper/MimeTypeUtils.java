package com.csiro.tickets.helper;

import java.util.HashMap;
import java.util.Map;

public class MimeTypeUtils {

  private static final Map<String, String> mimeTypeToHumanReadable = createMimeTypeMap();

  public static String toHumanReadable(String mimeType) {
    return mimeTypeToHumanReadable.getOrDefault(mimeType, "Unknown Format");
  }

  // Mime types based on https://freeformatter.com/mime-types-list.html
  private static Map<String, String> createMimeTypeMap() {
    Map<String, String> map = new HashMap<>();
    map.put("application/vnd.hzn-3d-crossword", "3D Crossword Plugin");
    map.put("video/3gpp", "3GP");
    map.put("video/3gpp2", "3GP2");
    map.put("application/vnd.mseq", "3GPP MSEQ File");
    map.put("application/vnd.3m.post-it-notes", "3M Post It Notes");
    map.put("application/vnd.3gpp.pic-bw-large", "3rd Generation Partnership Project - Pic Large");
    map.put("application/vnd.3gpp.pic-bw-small", "3rd Generation Partnership Project - Pic Small");
    map.put("application/vnd.3gpp.pic-bw-var", "3rd Generation Partnership Project - Pic Var");
    map.put(
        "application/vnd.3gpp2.tcap",
        "3rd Generation Partnership Project - Transaction Capabilities Application Part");
    map.put("application/x-7z-compressed", "7-Zip");
    map.put("application/x-abiword", "AbiWord");
    map.put("application/x-ace-compressed", "Ace Archive");
    map.put("application/vnd.americandynamics.acc", "Active Content Compression");
    map.put("application/vnd.acucobol", "ACU Cobol");
    map.put("application/vnd.acucorp", "ACU Cobol");
    map.put("audio/adpcm", "Adaptive differential pulse-code modulation");
    map.put("application/x-authorware-bin", "Adobe (Macropedia) Authorware - Binary File");
    map.put("application/x-authorware-map", "Adobe (Macropedia) Authorware - Map");
    map.put("application/x-authorware-seg", "Adobe (Macropedia) Authorware - Segment File");
    map.put("application/vnd.adobe.air-application-installer-package+zip", "Adobe AIR Application");
    map.put("application/x-shockwave-flash", "Adobe Flash");
    map.put("application/vnd.adobe.fxp", "Adobe Flex Project");
    map.put("application/pdf", "Adobe Portable Document Format");
    map.put("application/vnd.cups-ppd", "Adobe PostScript Printer Description File Format");
    map.put("application/x-director", "Adobe Shockwave Player");
    map.put("application/vnd.adobe.xdp+xml", "Adobe XML Data Package");
    map.put("application/vnd.adobe.xfdf", "Adobe XML Forms Data Format");
    map.put("audio/x-aac", "Advanced Audio Coding (AAC)");
    map.put("application/vnd.ahead.space", "Ahead AIR Application");
    map.put("application/vnd.airzip.filesecure.azf", "AirZip FileSECURE");
    map.put("application/vnd.airzip.filesecure.azs", "AirZip FileSECURE");
    map.put("application/vnd.amazon.ebook", "Amazon Kindle eBook format");
    map.put("application/vnd.amiga.ami", "AmigaDE");
    map.put("application/andrew-inset", "Andrew Toolkit");
    map.put("application/vnd.android.package-archive", "Android Package Archive");
    map.put(
        "application/vnd.anser-web-certificate-issue-initiation",
        "ANSER-WEB Terminal Client - Certificate Issue");
    map.put(
        "application/vnd.anser-web-funds-transfer-initiation",
        "ANSER-WEB Terminal Client - Web Funds Transfer");
    map.put("application/vnd.antix.game-component", "Antix Game Player");
    map.put("application/x-apple-diskimage", "Apple Disk Image");
    map.put("application/vnd.apple.installer+xml", "Apple Installer Package");
    map.put("application/applixware", "Applixware");
    map.put("application/vnd.hhe.lesson-player", "Archipelago Lesson Player");
    map.put("application/x-freearc", "Archive document - Multiple Fils Embedded");
    map.put("application/vnd.aristanetworks.swi", "Arista Networks Software Image");
    map.put("text/x-asm", "Assembler Source File");
    map.put("application/atomcat+xml", "Atom Publishing Protocol");
    map.put("application/atomsvc+xml", "Atom Publishing Protocol Service Document");
    map.put("application/atom+xml", "Atom Syndication Format");
    map.put("application/pkix-attr-cert", "Attribute Certificate");
    map.put("audio/x-aiff", "Audio Interchange File Format");
    map.put("video/x-msvideo", "Audio Video Interleave (AVI)");
    map.put("application/vnd.audiograph", "Audiograph");
    map.put("image/vnd.dxf", "AutoCAD DXF");
    map.put("model/vnd.dwf", "Autodesk Design Web Format (DWF)");
    map.put("image/avif", "AV1 Image File");
    map.put("text/plain-bas", "BAS Partitur Format");
    map.put("application/x-bcpio", "Binary CPIO Archive");
    map.put("application/octet-stream", "Binary Data");
    map.put("image/bmp", "Bitmap Image File");
    map.put("application/x-bittorrent", "BitTorrent");
    map.put("application/vnd.rim.cod", "Blackberry COD File");
    map.put("application/vnd.blueice.multipass", "Blueice Research Multipass");
    map.put("application/vnd.bmi", "BMI Drawing Data Interchange");
    map.put("application/x-sh", "Bourne Shell Script");
    map.put("image/prs.btif", "BTIF");
    map.put("application/vnd.businessobjects", "BusinessObjects");
    map.put("application/x-bzip", "Bzip Archive");
    map.put("application/x-bzip2", "Bzip2 Archive");
    map.put("application/x-csh", "C Shell Script");
    map.put("text/x-c", "C Source File");
    map.put("application/vnd.chemdraw+xml", "CambridgeSoft Chem Draw");
    map.put("text/css", "Cascading Style Sheets (CSS)");
    map.put("application/x-cdf", "CD Audio");
    map.put("chemical/x-cdx", "ChemDraw eXchange file");
    map.put("chemical/x-cml", "Chemical Markup Language");
    map.put("chemical/x-csml", "Chemical Style Markup Language");
    map.put("application/vnd.contact.cmsg", "CIM Database");
    map.put("application/vnd.claymore", "Claymore Data Files");
    map.put("application/vnd.clonk.c4group", "Clonk Game");
    map.put("image/vnd.dvb.subtitle", "Close Captioning - Subtitle");
    map.put("application/cdmi-capability", "Cloud Data Management Interface (CDMI) - Capability");
    map.put("application/cdmi-container", "Cloud Data Management Interface (CDMI) - Contaimer");
    map.put("application/cdmi-domain", "Cloud Data Management Interface (CDMI) - Domain");
    map.put("application/cdmi-object", "Cloud Data Management Interface (CDMI) - Object");
    map.put("application/cdmi-queue", "Cloud Data Management Interface (CDMI) - Queue");
    map.put("application/vnd.cluetrust.cartomobile-config", "ClueTrust CartoMobile - Config");
    map.put(
        "application/vnd.cluetrust.cartomobile-config-pkg",
        "ClueTrust CartoMobile - Config Package");
    map.put("image/x-cmu-raster", "CMU Image");
    map.put("model/vnd.collada+xml", "COLLADA");
    map.put("text/csv", "Comma-Seperated Values");
    map.put("application/mac-compactpro", "Compact Pro");
    map.put("application/vnd.wap.wmlc", "Compiled Wireless Markup Language (WMLC)");
    map.put("image/cgm", "Computer Graphics Metafile");
    map.put("x-conference/x-cooltalk", "CoolTalk");
    map.put("image/x-cmx", "Corel Metafile Exchange (CMX)");
    map.put("application/vnd.xara", "CorelXARA");
    map.put("application/vnd.cosmocaller", "CosmoCaller");
    map.put("application/x-cpio", "CPIO Archive");
    map.put("application/vnd.crick.clicker", "CrickSoftware - Clicker");
    map.put("application/vnd.crick.clicker.keyboard", "CrickSoftware - Clicker - Keyboard");
    map.put("application/vnd.crick.clicker.palette", "CrickSoftware - Clicker - Palette");
    map.put("application/vnd.crick.clicker.template", "CrickSoftware - Clicker - Template");
    map.put("application/vnd.crick.clicker.wordbank", "CrickSoftware - Clicker - Wordbank");
    map.put("application/vnd.criticaltools.wbs+xml", "Critical Tools - PERT Chart EXPERT");
    map.put("application/vnd.rig.cryptonote", "CryptoNote");
    map.put("chemical/x-cif", "Crystallographic Interchange Format");
    map.put("chemical/x-cmdf", "CrystalMaker Data Format");
    map.put("application/cu-seeme", "CU-SeeMe");
    map.put("application/prs.cww", "CU-Writer");
    map.put("text/vnd.curl", "Curl - Applet");
    map.put("text/vnd.curl.dcurl", "Curl - Detached Applet");
    map.put("text/vnd.curl.mcurl", "Curl - Manifest File");
    map.put("text/vnd.curl.scurl", "Curl - Source Code");
    map.put("application/vnd.curl.car", "CURL Applet");
    map.put("application/vnd.curl.pcurl", "CURL Applet");
    map.put("application/vnd.yellowriver-custom-menu", "CustomMenu");
    map.put(
        "application/dssc+der",
        "Data Structure for the Security Suitability of Cryptographic Algorithms");
    map.put(
        "application/dssc+xml",
        "Data Structure for the Security Suitability of Cryptographic Algorithms");
    map.put("application/x-debian-package", "Debian Package");
    map.put("audio/vnd.dece.audio", "DECE Audio");
    map.put("image/vnd.dece.graphic", "DECE Graphic");
    map.put("video/vnd.dece.hd", "DECE High Definition Video");
    map.put("video/vnd.dece.mobile", "DECE Mobile Video");
    map.put("video/vnd.uvvu.mp4", "DECE MP4");
    map.put("video/vnd.dece.pd", "DECE PD Video");
    map.put("video/vnd.dece.sd", "DECE SD Video");
    map.put("video/vnd.dece.video", "DECE Video");
    map.put("application/x-dvi", "Device Independent File Format (DVI)");
    map.put("application/vnd.fdsn.seed", "Digital Siesmograph Networks - SEED Datafiles");
    map.put("application/x-dtbook+xml", "Digital Talking Book");
    map.put("application/x-dtbresource+xml", "Digital Talking Book - Resource File");
    map.put("application/vnd.dvb.ait", "Digital Video Broadcasting");
    map.put("application/vnd.dvb.service", "Digital Video Broadcasting");
    map.put("audio/vnd.digital-winds", "Digital Winds Music");
    map.put("image/vnd.djvu", "DjVu");
    map.put("application/xml-dtd", "Document Type Definition");
    map.put("application/vnd.dolby.mlp", "Dolby Meridian Lossless Packing");
    map.put("application/x-doom", "Doom Video Game");
    map.put("application/vnd.dpgraph", "DPGraph");
    map.put("audio/vnd.dra", "DRA Audio");
    map.put("application/vnd.dreamfactory", "DreamFactory");
    map.put("audio/vnd.dts", "DTS Audio");
    map.put("audio/vnd.dts.hd", "DTS High Definition Audio");
    map.put("image/vnd.dwg", "DWG Drawing");
    map.put("application/vnd.dynageo", "DynaGeo");
    map.put("application/ecmascript", "ECMAScript");
    map.put("application/vnd.ecowin.chart", "EcoWin Chart");
    map.put("image/vnd.fujixerox.edmics-mmr", "EDMICS 2000");
    map.put("image/vnd.fujixerox.edmics-rlc", "EDMICS 2000");
    map.put("application/exi", "Efficient XML Interchange");
    map.put("application/vnd.proteus.magazine", "EFI Proteus");
    map.put("application/epub+zip", "Electronic Publication");
    map.put("message/rfc822", "Email Message");
    map.put("application/vnd.enliven", "Enliven Viewer");
    map.put("application/vnd.is-xpr", "Express by Infoseek");
    map.put("image/vnd.xiff", "eXtended Image File Format (XIFF)");
    map.put("application/vnd.xfdl", "Extensible Forms Description Language");
    map.put("application/emma+xml", "Extensible MultiModal Annotation");
    map.put("application/vnd.ezpix-album", "EZPix Secure Photo Album");
    map.put("application/vnd.ezpix-package", "EZPix Secure Photo Album");
    map.put("image/vnd.fst", "FAST Search & Transfer ASA");
    map.put("video/vnd.fvt", "FAST Search & Transfer ASA");
    map.put("image/vnd.fastbidsheet", "FastBid Sheet");
    map.put("application/vnd.denovo.fcselayout-link", "FCS Express Layout Link");
    map.put("video/x-f4v", "Flash Video");
    map.put("video/x-flv", "Flash Video");
    map.put("image/vnd.fpx", "FlashPix");
    map.put("image/vnd.net-fpx", "FlashPix");
    map.put("text/vnd.fmi.flexstor", "FLEXSTOR");
    map.put("video/x-fli", "FLI/FLC Animation Format");
    map.put("application/vnd.fluxtime.clip", "FluxTime Clip");
    map.put("application/vnd.fdf", "Forms Data Format");
    map.put("text/x-fortran", "Fortran Source File");
    map.put("application/vnd.mif", "FrameMaker Interchange Format");
    map.put("application/vnd.framemaker", "FrameMaker Normal Format");
    map.put("image/x-freehand", "FreeHand MX");
    map.put("application/vnd.fsc.weblaunch", "Friendly Software Corporation");
    map.put("application/vnd.frogans.fnc", "Frogans Player");
    map.put("application/vnd.frogans.ltf", "Frogans Player");
    map.put("application/vnd.fujixerox.ddd", "Fujitsu - Xerox 2D CAD Data");
    map.put("application/vnd.fujixerox.docuworks", "Fujitsu - Xerox DocuWorks");
    map.put("application/vnd.fujixerox.docuworks.binder", "Fujitsu - Xerox DocuWorks Binder");
    map.put("application/vnd.fujitsu.oasys", "Fujitsu Oasys");
    map.put("application/vnd.fujitsu.oasys2", "Fujitsu Oasys");
    map.put("application/vnd.fujitsu.oasys3", "Fujitsu Oasys");
    map.put("application/vnd.fujitsu.oasysgp", "Fujitsu Oasys");
    map.put("application/vnd.fujitsu.oasysprs", "Fujitsu Oasys");
    map.put("application/x-futuresplash", "FutureSplash Animator");
    map.put("application/vnd.fuzzysheet", "FuzzySheet");
    map.put("image/g3fax", "G3 Fax Image");
    map.put("application/vnd.gmx", "GameMaker ActiveX");
    map.put("model/vnd.gtw", "Gen-Trix Studio");
    map.put("application/vnd.genomatix.tuxedo", "Genomatix Tuxedo Framework");
    map.put("application/vnd.geogebra.file", "GeoGebra");
    map.put("application/vnd.geogebra.tool", "GeoGebra");
    map.put("model/vnd.gdl", "Geometric Description Language (GDL)");
    map.put("application/vnd.geometry-explorer", "GeoMetry Explorer");
    map.put("application/vnd.geonext", "GEONExT and JSXGraph");
    map.put("application/vnd.geoplan", "GeoplanW");
    map.put("application/vnd.geospace", "GeospacW");
    map.put("application/x-font-ghostscript", "Ghostscript Font");
    map.put("application/x-font-bdf", "Glyph Bitmap Distribution Format");
    map.put("application/x-gtar", "GNU Tar Files");
    map.put("application/x-texinfo", "GNU Texinfo Document");
    map.put("application/x-gnumeric", "Gnumeric");
    map.put("application/vnd.google-earth.kml+xml", "Google Earth - KML");
    map.put("application/vnd.google-earth.kmz", "Google Earth - Zipped KML");
    map.put("application/gpx+xml", "GPS eXchange Format");
    map.put("application/vnd.grafeq", "GrafEq");
    map.put("image/gif", "Graphics Interchange Format");
    map.put("text/vnd.graphviz", "Graphviz");
    map.put("application/vnd.groove-account", "Groove - Account");
    map.put("application/vnd.groove-help", "Groove - Help");
    map.put("application/vnd.groove-identity-message", "Groove - Identity Message");
    map.put("application/vnd.groove-injector", "Groove - Injector");
    map.put("application/vnd.groove-tool-message", "Groove - Tool Message");
    map.put("application/vnd.groove-tool-template", "Groove - Tool Template");
    map.put("application/vnd.groove-vcard", "Groove - Vcard");
    map.put("application/gzip", "GZip");
    map.put("video/h261", "H.261");
    map.put("video/h263", "H.263");
    map.put("video/h264", "H.264");
    map.put("application/vnd.hp-hpid", "Hewlett Packard Instant Delivery");
    map.put("application/vnd.hp-hps", "Hewlett-Packard's WebPrintSmart");
    map.put("application/x-hdf", "Hierarchical Data Format");
    map.put("audio/vnd.rip", "Hit'n'Mix");
    map.put("application/vnd.hbci", "Homebanking Computer Interface (HBCI)");
    map.put("application/vnd.hp-jlyt", "HP Indigo Digital Press - Job Layout Languate");
    map.put("application/vnd.hp-pcl", "HP Printer Command Language");
    map.put("application/vnd.hp-hpgl", "HP-GL/2 and HP RTL");
    map.put("application/vnd.yamaha.hv-script", "HV Script");
    map.put("application/vnd.yamaha.hv-dic", "HV Voice Dictionary");
    map.put("application/vnd.yamaha.hv-voice", "HV Voice Parameter");
    map.put("application/vnd.hydrostatix.sof-data", "Hydrostatix Master Suite");
    map.put("application/hyperstudio", "Hyperstudio");
    map.put("application/vnd.hal+xml", "Hypertext Application Language");
    map.put("text/html", "HyperText Markup Language (HTML)");
    map.put("application/vnd.ibm.rights-management", "IBM DB2 Rights Manager");
    map.put(
        "application/vnd.ibm.secure-container",
        "IBM Electronic Media Management System - Secure Container");
    map.put("text/calendar", "iCalendar");
    map.put("application/vnd.iccprofile", "ICC profile");
    map.put("image/x-icon", "Icon Image");
    map.put("application/vnd.igloader", "igLoader");
    map.put("image/ief", "Image Exchange Format");
    map.put("application/vnd.immervision-ivp", "ImmerVision PURE Players");
    map.put("application/vnd.immervision-ivu", "ImmerVision PURE Players");
    map.put("application/reginfo+xml", "IMS Networks");
    map.put("text/vnd.in3d.3dml", "In3D - 3DML");
    map.put("text/vnd.in3d.spot", "In3D - 3DML");
    map.put("model/iges", "Initial Graphics Exchange Specification (IGES)");
    map.put("application/vnd.intergeo", "Interactive Geometry Software");
    map.put("application/vnd.cinderella", "Interactive Geometry Software Cinderella");
    map.put("application/vnd.intercon.formnet", "Intercon FormNet");
    map.put("application/vnd.isac.fcs", "International Society for Advancement of Cytometry");
    map.put("application/ipfix", "Internet Protocol Flow Information Export");
    map.put("application/pkix-cert", "Internet Public Key Infrastructure - Certificate");
    map.put(
        "application/pkixcmp",
        "Internet Public Key Infrastructure - Certificate Management Protocole");
    map.put(
        "application/pkix-crl",
        "Internet Public Key Infrastructure - Certificate Revocation Lists");
    map.put("application/pkix-pkipath", "Internet Public Key Infrastructure - Certification Path");
    map.put("application/vnd.insors.igm", "IOCOM Visimeet");
    map.put("application/vnd.ipunplugged.rcprofile", "IP Unplugged Roaming Client");
    map.put("application/vnd.irepository.package+xml", "iRepository / Lucidoc Editor");
    map.put("text/vnd.sun.j2me.app-descriptor", "J2ME App Descriptor");
    map.put("application/java-archive", "Java Archive");
    map.put("application/java-vm", "Java Bytecode File");
    map.put("application/x-java-jnlp-file", "Java Network Launching Protocol");
    map.put("application/java-serialized-object", "Java Serialized Object");
    map.put("text/x-java-source,java", "Java Source File");
    map.put("application/javascript", "JavaScript");
    map.put("text/javascript", "JavaScript Module");
    map.put("application/json", "JavaScript Object Notation (JSON)");
    map.put("application/vnd.joost.joda-archive", "Joda Archive");
    map.put("video/jpm", "JPEG 2000 Compound Image File Format");
    map.put("image/jpeg", "JPEG Image");
    map.put("image/x-citrix-jpeg", "JPEG Image (Citrix client)");
    map.put("image/pjpeg", "JPEG Image (Progressive)");
    map.put("video/jpeg", "JPGVideo");
    map.put("application/ld+json", "JSON - Linked Data");
    map.put("application/vnd.kahootz", "Kahootz");
    map.put("application/vnd.chipnuts.karaoke-mmd", "Karaoke on Chipnuts Chipsets");
    map.put("application/vnd.kde.karbon", "KDE KOffice Office Suite - Karbon");
    map.put("application/vnd.kde.kchart", "KDE KOffice Office Suite - KChart");
    map.put("application/vnd.kde.kformula", "KDE KOffice Office Suite - Kformula");
    map.put("application/vnd.kde.kivio", "KDE KOffice Office Suite - Kivio");
    map.put("application/vnd.kde.kontour", "KDE KOffice Office Suite - Kontour");
    map.put("application/vnd.kde.kpresenter", "KDE KOffice Office Suite - Kpresenter");
    map.put("application/vnd.kde.kspread", "KDE KOffice Office Suite - Kspread");
    map.put("application/vnd.kde.kword", "KDE KOffice Office Suite - Kword");
    map.put("application/vnd.kenameaapp", "Kenamea App");
    map.put("application/vnd.kidspiration", "Kidspiration");
    map.put("application/vnd.kinar", "Kinar Applications");
    map.put("application/vnd.kodak-descriptor", "Kodak Storyshare");
    map.put("application/vnd.las.las+xml", "Laser App Enterprise");
    map.put("application/x-latex", "LaTeX");
    map.put("application/vnd.llamagraphics.life-balance.desktop", "Life Balance - Desktop Edition");
    map.put(
        "application/vnd.llamagraphics.life-balance.exchange+xml",
        "Life Balance - Exchange Format");
    map.put("application/vnd.jam", "Lightspeed Audio Lab");
    map.put("application/vnd.lotus-1-2-3", "Lotus 1-2-3");
    map.put("application/vnd.lotus-approach", "Lotus Approach");
    map.put("application/vnd.lotus-freelance", "Lotus Freelance");
    map.put("application/vnd.lotus-notes", "Lotus Notes");
    map.put("application/vnd.lotus-organizer", "Lotus Organizer");
    map.put("application/vnd.lotus-screencam", "Lotus Screencam");
    map.put("application/vnd.lotus-wordpro", "Lotus Wordpro");
    map.put("audio/vnd.lucent.voice", "Lucent Voice");
    map.put("audio/x-mpegurl", "M3U (Multimedia Playlist)");
    map.put("video/x-m4v", "M4v");
    map.put("application/mac-binhex40", "Macintosh BinHex 4.0");
    map.put("application/vnd.macports.portpkg", "MacPorts Port System");
    map.put("application/vnd.osgeo.mapguide.package", "MapGuide DBXML");
    map.put("application/marc", "MARC Formats");
    map.put("application/marcxml+xml", "MARC21 XML Schema");
    map.put("application/mxf", "Material Exchange Format");
    map.put("application/vnd.wolfram.player", "Mathematica Notebook Player");
    map.put("application/mathematica", "Mathematica Notebooks");
    map.put("application/mathml+xml", "Mathematical Markup Language");
    map.put("application/mbox", "Mbox database files");
    map.put("application/vnd.medcalcdata", "MedCalc");
    map.put("application/mediaservercontrol+xml", "Media Server Control Markup Language");
    map.put("application/vnd.mediastation.cdkey", "MediaRemote");
    map.put("application/vnd.mfer", "Medical Waveform Encoding Format");
    map.put("application/vnd.mfmp", "Melody Format for Mobile Platform");
    map.put("model/mesh", "Mesh Data Type");
    map.put("application/mads+xml", "Metadata Authority Description Schema");
    map.put("application/mets+xml", "Metadata Encoding and Transmission Standard");
    map.put("application/mods+xml", "Metadata Object Description Schema");
    map.put("application/metalink4+xml", "Metalink");
    map.put("application/vnd.mcd", "Micro CADAM Helix D&D");
    map.put("application/vnd.micrografx.flo", "Micrografx");
    map.put("application/vnd.micrografx.igx", "Micrografx iGrafx Professional");
    map.put("application/vnd.eszigno3+xml", "MICROSEC e-Szign�");
    map.put("application/x-msaccess", "Microsoft Access");
    map.put("video/x-ms-asf", "Microsoft Advanced Systems Format (ASF)");
    map.put("application/x-msdownload", "Microsoft Application");
    map.put("application/vnd.ms-artgalry", "Microsoft Artgalry");
    map.put("application/vnd.ms-cab-compressed", "Microsoft Cabinet File");
    map.put("application/vnd.ms-ims", "Microsoft Class Server");
    map.put("application/x-ms-application", "Microsoft ClickOnce");
    map.put("application/x-msclip", "Microsoft Clipboard Clip");
    map.put("image/vnd.ms-modi", "Microsoft Document Imaging Format");
    map.put("application/vnd.ms-fontobject", "Microsoft Embedded OpenType");
    map.put("application/vnd.ms-excel", "Microsoft Excel");
    map.put("application/vnd.ms-excel.addin.macroenabled.12", "Microsoft Excel - Add-In File");
    map.put(
        "application/vnd.ms-excel.sheet.binary.macroenabled.12",
        "Microsoft Excel - Binary Workbook");
    map.put(
        "application/vnd.ms-excel.template.macroenabled.12",
        "Microsoft Excel - Macro-Enabled Template File");
    map.put(
        "application/vnd.ms-excel.sheet.macroenabled.12",
        "Microsoft Excel - Macro-Enabled Workbook");
    map.put("application/vnd.ms-htmlhelp", "Microsoft Html Help File");
    map.put("application/x-mscardfile", "Microsoft Information Card");
    map.put("application/vnd.ms-lrm", "Microsoft Learning Resource Module");
    map.put("application/x-msmediaview", "Microsoft MediaView");
    map.put("application/x-msmoney", "Microsoft Money");
    map.put(
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Microsoft Office - OOXML - Presentation");
    map.put(
        "application/vnd.openxmlformats-officedocument.presentationml.slide",
        "Microsoft Office - OOXML - Presentation (Slide)");
    map.put(
        "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
        "Microsoft Office - OOXML - Presentation (Slideshow)");
    map.put(
        "application/vnd.openxmlformats-officedocument.presentationml.template",
        "Microsoft Office - OOXML - Presentation Template");
    map.put(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Microsoft Office - OOXML - Spreadsheet");
    map.put(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
        "Microsoft Office - OOXML - Spreadsheet Template");
    map.put(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Microsoft Office - OOXML - Word Document");
    map.put(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
        "Microsoft Office - OOXML - Word Document Template");
    map.put("application/x-msbinder", "Microsoft Office Binder");
    map.put("application/vnd.ms-officetheme", "Microsoft Office System Release Theme");
    map.put("application/onenote", "Microsoft OneNote");
    map.put("audio/vnd.ms-playready.media.pya", "Microsoft PlayReady Ecosystem");
    map.put("video/vnd.ms-playready.media.pyv", "Microsoft PlayReady Ecosystem Video");
    map.put("application/vnd.ms-powerpoint", "Microsoft PowerPoint");
    map.put(
        "application/vnd.ms-powerpoint.addin.macroenabled.12",
        "Microsoft PowerPoint - Add-in file");
    map.put(
        "application/vnd.ms-powerpoint.slide.macroenabled.12",
        "Microsoft PowerPoint - Macro-Enabled Open XML Slide");
    map.put(
        "application/vnd.ms-powerpoint.presentation.macroenabled.12",
        "Microsoft PowerPoint - Macro-Enabled Presentation File");
    map.put(
        "application/vnd.ms-powerpoint.slideshow.macroenabled.12",
        "Microsoft PowerPoint - Macro-Enabled Slide Show File");
    map.put(
        "application/vnd.ms-powerpoint.template.macroenabled.12",
        "Microsoft PowerPoint - Macro-Enabled Template File");
    map.put("application/vnd.ms-project", "Microsoft Project");
    map.put("application/x-mspublisher", "Microsoft Publisher");
    map.put("application/x-msschedule", "Microsoft Schedule+");
    map.put("application/x-silverlight-app", "Microsoft Silverlight");
    map.put("application/vnd.ms-pki.stl", "Microsoft Trust UI Provider - Certificate Trust Link");
    map.put("application/vnd.ms-pki.seccat", "Microsoft Trust UI Provider - Security Catalog");
    map.put("application/vnd.visio", "Microsoft Visio");
    map.put("application/vnd.visio2013", "Microsoft Visio 2013");
    map.put("video/x-ms-wm", "Microsoft Windows Media");
    map.put("audio/x-ms-wma", "Microsoft Windows Media Audio");
    map.put("audio/x-ms-wax", "Microsoft Windows Media Audio Redirector");
    map.put("video/x-ms-wmx", "Microsoft Windows Media Audio/Video Playlist");
    map.put("application/x-ms-wmd", "Microsoft Windows Media Player Download Package");
    map.put("application/vnd.ms-wpl", "Microsoft Windows Media Player Playlist");
    map.put("application/x-ms-wmz", "Microsoft Windows Media Player Skin Package");
    map.put("video/x-ms-wmv", "Microsoft Windows Media Video");
    map.put("video/x-ms-wvx", "Microsoft Windows Media Video Playlist");
    map.put("application/x-msmetafile", "Microsoft Windows Metafile");
    map.put("application/x-msterminal", "Microsoft Windows Terminal Services");
    map.put("application/msword", "Microsoft Word");
    map.put(
        "application/vnd.ms-word.document.macroenabled.12",
        "Microsoft Word - Macro-Enabled Document");
    map.put(
        "application/vnd.ms-word.template.macroenabled.12",
        "Microsoft Word - Macro-Enabled Template");
    map.put("application/x-mswrite", "Microsoft Wordpad");
    map.put("application/vnd.ms-works", "Microsoft Works");
    map.put("application/x-ms-xbap", "Microsoft XAML Browser Application");
    map.put("application/vnd.ms-xpsdocument", "Microsoft XML Paper Specification");
    map.put("audio/midi", "MIDI");
    map.put("audio/midi", "MIDI - Musical Instrument Digital Interface");
    map.put("application/vnd.ibm.minipay", "MiniPay");
    map.put("application/vnd.ibm.modcap", "MO:DCA-P");
    map.put("application/vnd.jcp.javame.midlet-rms", "Mobile Information Device Profile");
    map.put("application/vnd.tmobile-livetv", "MobileTV");
    map.put("application/x-mobipocket-ebook", "Mobipocket");
    map.put("application/vnd.mobius.mbk", "Mobius Management Systems - Basket file");
    map.put("application/vnd.mobius.dis", "Mobius Management Systems - Distribution Database");
    map.put(
        "application/vnd.mobius.plc",
        "Mobius Management Systems - Policy Definition Language File");
    map.put("application/vnd.mobius.mqy", "Mobius Management Systems - Query File");
    map.put("application/vnd.mobius.msl", "Mobius Management Systems - Script Language");
    map.put("application/vnd.mobius.txf", "Mobius Management Systems - Topic Index File");
    map.put("application/vnd.mobius.daf", "Mobius Management Systems - UniversalArchive");
    map.put("text/vnd.fly", "mod_fly / fly.cgi");
    map.put("application/vnd.mophun.certificate", "Mophun Certificate");
    map.put("application/vnd.mophun.application", "Mophun VM");
    map.put("video/mj2", "Motion JPEG 2000");
    map.put("audio/mpeg", "MPEG Audio");
    map.put("video/mp2t", "MPEG Transport Stream");
    map.put("video/vnd.mpegurl", "MPEG Url");
    map.put("video/mpeg", "MPEG Video");
    map.put("application/mp21", "MPEG-21");
    map.put("audio/mp4", "MPEG-4 Audio");
    map.put("video/mp4", "MPEG-4 Video");
    map.put("application/mp4", "MPEG4");
    map.put("application/vnd.apple.mpegurl", "Multimedia Playlist Unicode");
    map.put(
        "application/vnd.musician",
        "MUsical Score Interpreted Code Invented for the ASCII designation of Notation");
    map.put("application/vnd.muvee.style", "Muvee Automatic Video Editing");
    map.put("application/xv+xml", "MXML");
    map.put("application/vnd.nokia.n-gage.data", "N-Gage Game Data");
    map.put("application/vnd.nokia.n-gage.symbian.install", "N-Gage Game Installer");
    map.put("application/x-dtbncx+xml", "Navigation Control file for XML (for ePub)");
    map.put("application/x-netcdf", "Network Common Data Form (NetCDF)");
    map.put("application/vnd.neurolanguage.nlu", "neuroLanguage");
    map.put("application/vnd.dna", "New Moon Liftoff/DNA");
    map.put("application/vnd.noblenet-directory", "NobleNet Directory");
    map.put("application/vnd.noblenet-sealer", "NobleNet Sealer");
    map.put("application/vnd.noblenet-web", "NobleNet Web");
    map.put("application/vnd.nokia.radio-preset", "Nokia Radio Application - Preset");
    map.put("application/vnd.nokia.radio-presets", "Nokia Radio Application - Preset");
    map.put("text/n3", "Notation3");
    map.put("application/vnd.novadigm.edm", "Novadigm's RADIA and EDM products");
    map.put("application/vnd.novadigm.edx", "Novadigm's RADIA and EDM products");
    map.put("application/vnd.novadigm.ext", "Novadigm's RADIA and EDM products");
    map.put("application/vnd.flographit", "NpGraphIt");
    map.put("audio/vnd.nuera.ecelp4800", "Nuera ECELP 4800");
    map.put("audio/vnd.nuera.ecelp7470", "Nuera ECELP 7470");
    map.put("audio/vnd.nuera.ecelp9600", "Nuera ECELP 9600");
    map.put("application/oda", "Office Document Architecture");
    map.put("application/ogg", "Ogg");
    map.put("audio/ogg", "Ogg Audio");
    map.put("video/ogg", "Ogg Video");
    map.put("application/vnd.oma.dd2+xml", "OMA Download Agents");
    map.put("application/vnd.oasis.opendocument.text-web", "Open Document Text Web");
    map.put("application/oebps-package+xml", "Open eBook Publication Structure");
    map.put("application/vnd.intu.qbo", "Open Financial Exchange");
    map.put("application/vnd.openofficeorg.extension", "Open Office Extension");
    map.put("application/vnd.yamaha.openscoreformat", "Open Score Format");
    map.put("audio/webm", "Open Web Media Project - Audio");
    map.put("video/webm", "Open Web Media Project - Video");
    map.put("application/vnd.oasis.opendocument.chart", "OpenDocument Chart");
    map.put("application/vnd.oasis.opendocument.chart-template", "OpenDocument Chart Template");
    map.put("application/vnd.oasis.opendocument.database", "OpenDocument Database");
    map.put("application/vnd.oasis.opendocument.formula", "OpenDocument Formula");
    map.put("application/vnd.oasis.opendocument.formula-template", "OpenDocument Formula Template");
    map.put("application/vnd.oasis.opendocument.graphics", "OpenDocument Graphics");
    map.put(
        "application/vnd.oasis.opendocument.graphics-template", "OpenDocument Graphics Template");
    map.put("application/vnd.oasis.opendocument.image", "OpenDocument Image");
    map.put("application/vnd.oasis.opendocument.image-template", "OpenDocument Image Template");
    map.put("application/vnd.oasis.opendocument.presentation", "OpenDocument Presentation");
    map.put(
        "application/vnd.oasis.opendocument.presentation-template",
        "OpenDocument Presentation Template");
    map.put("application/vnd.oasis.opendocument.spreadsheet", "OpenDocument Spreadsheet");
    map.put(
        "application/vnd.oasis.opendocument.spreadsheet-template",
        "OpenDocument Spreadsheet Template");
    map.put("application/vnd.oasis.opendocument.text", "OpenDocument Text");
    map.put("application/vnd.oasis.opendocument.text-master", "OpenDocument Text Master");
    map.put("application/vnd.oasis.opendocument.text-template", "OpenDocument Text Template");
    map.put("image/ktx", "OpenGL Textures (KTX)");
    map.put("application/vnd.sun.xml.calc", "OpenOffice - Calc (Spreadsheet)");
    map.put("application/vnd.sun.xml.calc.template", "OpenOffice - Calc Template (Spreadsheet)");
    map.put("application/vnd.sun.xml.draw", "OpenOffice - Draw (Graphics)");
    map.put("application/vnd.sun.xml.draw.template", "OpenOffice - Draw Template (Graphics)");
    map.put("application/vnd.sun.xml.impress", "OpenOffice - Impress (Presentation)");
    map.put(
        "application/vnd.sun.xml.impress.template", "OpenOffice - Impress Template (Presentation)");
    map.put("application/vnd.sun.xml.math", "OpenOffice - Math (Formula)");
    map.put("application/vnd.sun.xml.writer", "OpenOffice - Writer (Text - HTML)");
    map.put("application/vnd.sun.xml.writer.global", "OpenOffice - Writer (Text - HTML)");
    map.put(
        "application/vnd.sun.xml.writer.template", "OpenOffice - Writer Template (Text - HTML)");
    map.put("application/x-font-otf", "OpenType Font File");
    map.put("audio/opus", "Opus Audio");
    map.put("application/vnd.yamaha.openscoreformat.osfpvg+xml", "OSFPVG");
    map.put("application/vnd.osgi.dp", "OSGi Deployment Package");
    map.put("application/vnd.palm", "PalmOS Data");
    map.put("text/x-pascal", "Pascal Source File");
    map.put("application/vnd.pawaafile", "PawaaFILE");
    map.put("application/vnd.hp-pclxl", "PCL 6 Enhanced (Formely PCL XL)");
    map.put("application/vnd.picsel", "Pcsel eFIF File");
    map.put("image/x-pcx", "PCX Image");
    map.put("image/vnd.adobe.photoshop", "Photoshop Document");
    map.put("application/pics-rules", "PICSRules");
    map.put("image/x-pict", "PICT Image");
    map.put("application/x-chat", "pIRCh");
    map.put("application/pkcs10", "PKCS #10 - Certification Request Standard");
    map.put("application/x-pkcs12", "PKCS #12 - Personal Information Exchange Syntax Standard");
    map.put("application/pkcs7-mime", "PKCS #7 - Cryptographic Message Syntax Standard");
    map.put("application/pkcs7-signature", "PKCS #7 - Cryptographic Message Syntax Standard");
    map.put(
        "application/x-pkcs7-certreqresp",
        "PKCS #7 - Cryptographic Message Syntax Standard (Certificate Request Response)");
    map.put(
        "application/x-pkcs7-certificates",
        "PKCS #7 - Cryptographic Message Syntax Standard (Certificates)");
    map.put("application/pkcs8", "PKCS #8 - Private-Key Information Syntax Standard");
    map.put("application/vnd.pocketlearn", "PocketLearn Viewers");
    map.put("image/x-portable-anymap", "Portable Anymap Image");
    map.put("image/x-portable-bitmap", "Portable Bitmap Format");
    map.put("application/x-font-pcf", "Portable Compiled Format");
    map.put("application/font-tdpfr", "Portable Font Resource");
    map.put("application/x-chess-pgn", "Portable Game Notation (Chess Games)");
    map.put("image/x-portable-graymap", "Portable Graymap Format");
    map.put("image/png", "Portable Network Graphics (PNG)");
    map.put("image/x-citrix-png", "Portable Network Graphics (PNG) (Citrix client)");
    map.put("image/x-png", "Portable Network Graphics (PNG) (x-token)");
    map.put("image/x-portable-pixmap", "Portable Pixmap Format");
    map.put("application/pskc+xml", "Portable Symmetric Key Container");
    map.put("application/vnd.ctc-posml", "PosML");
    map.put("application/postscript", "PostScript");
    map.put("application/x-font-type1", "PostScript Fonts");
    map.put("application/vnd.powerbuilder6", "PowerBuilder");
    map.put("application/pgp-encrypted", "Pretty Good Privacy");
    map.put("application/pgp-signature", "Pretty Good Privacy - Signature");
    map.put("application/vnd.previewsystems.box", "Preview Systems ZipLock/VBox");
    map.put("application/vnd.pvi.ptid1", "Princeton Video Image");
    map.put("application/pls+xml", "Pronunciation Lexicon Specification");
    map.put("application/vnd.pg.format", "Proprietary P&G Standard Reporting System");
    map.put("application/vnd.pg.osasli", "Proprietary P&G Standard Reporting System");
    map.put("text/prs.lines.tag", "PRS Lines Tag");
    map.put("application/x-font-linux-psf", "PSF Fonts");
    map.put("application/vnd.publishare-delta-tree", "PubliShare Objects");
    map.put("application/vnd.pmi.widget", "Qualcomm's Plaza Mobile Internet");
    map.put("application/vnd.quark.quarkxpress", "QuarkXpress");
    map.put("application/vnd.epson.esf", "QUASS Stream Player");
    map.put("application/vnd.epson.msf", "QUASS Stream Player");
    map.put("application/vnd.epson.ssf", "QUASS Stream Player");
    map.put("application/vnd.epson.quickanime", "QuickAnime Player");
    map.put("application/vnd.intu.qfx", "Quicken");
    map.put("video/quicktime", "Quicktime Video");
    map.put("application/x-rar-compressed", "RAR Archive");
    map.put("audio/x-pn-realaudio", "Real Audio Sound");
    map.put("audio/x-pn-realaudio-plugin", "Real Audio Sound");
    map.put("application/rsd+xml", "Really Simple Discovery");
    map.put("application/vnd.rn-realmedia", "RealMedia");
    map.put("application/vnd.realvnc.bed", "RealVNC");
    map.put("application/vnd.recordare.musicxml", "Recordare Applications");
    map.put("application/vnd.recordare.musicxml+xml", "Recordare Applications");
    map.put("application/relax-ng-compact-syntax", "Relax NG Compact Syntax");
    map.put("application/vnd.data-vision.rdz", "RemoteDocs R-Viewer");
    map.put("application/rdf+xml", "Resource Description Framework");
    map.put("application/vnd.cloanto.rp9", "RetroPlatform Player");
    map.put("application/vnd.jisp", "RhymBox");
    map.put("application/rtf", "Rich Text Format");
    map.put("text/richtext", "Rich Text Format (RTF)");
    map.put("application/vnd.route66.link66+xml", "ROUTE 66 Location Based Services");
    map.put("application/rss+xml", "RSS - Really Simple Syndication");
    map.put("application/shf+xml", "S Hexdump Format");
    map.put("application/vnd.sailingtracker.track", "SailingTracker");
    map.put("image/svg+xml", "Scalable Vector Graphics (SVG)");
    map.put("application/vnd.sus-calendar", "ScheduleUs");
    map.put("application/sru+xml", "Search/Retrieve via URL Response Format");
    map.put("application/set-payment-initiation", "Secure Electronic Transaction - Payment");
    map.put(
        "application/set-registration-initiation", "Secure Electronic Transaction - Registration");
    map.put("application/vnd.sema", "Secured eMail");
    map.put("application/vnd.semd", "Secured eMail");
    map.put("application/vnd.semf", "Secured eMail");
    map.put("application/vnd.seemail", "SeeMail");
    map.put("application/x-font-snf", "Server Normal Format");
    map.put(
        "application/scvp-vp-request",
        "Server-Based Certificate Validation Protocol - Validation Policies - Request");
    map.put(
        "application/scvp-vp-response",
        "Server-Based Certificate Validation Protocol - Validation Policies - Response");
    map.put(
        "application/scvp-cv-request",
        "Server-Based Certificate Validation Protocol - Validation Request");
    map.put(
        "application/scvp-cv-response",
        "Server-Based Certificate Validation Protocol - Validation Response");
    map.put("application/sdp", "Session Description Protocol");
    map.put("text/x-setext", "Setext");
    map.put("video/x-sgi-movie", "SGI Movie");
    map.put("application/vnd.shana.informed.formdata", "Shana Informed Filler");
    map.put("application/vnd.shana.informed.formtemplate", "Shana Informed Filler");
    map.put("application/vnd.shana.informed.interchange", "Shana Informed Filler");
    map.put("application/vnd.shana.informed.package", "Shana Informed Filler");
    map.put("application/thraud+xml", "Sharing Transaction Fraud Data");
    map.put("application/x-shar", "Shell Archive");
    map.put("image/x-rgb", "Silicon Graphics RGB Bitmap");
    map.put("application/vnd.epson.salt", "SimpleAnimeLite Player");
    map.put("application/vnd.accpac.simply.aso", "Simply Accounting");
    map.put("application/vnd.accpac.simply.imp", "Simply Accounting - Data Import");
    map.put("application/vnd.simtech-mindmapper", "SimTech MindMapper");
    map.put("application/vnd.commonspace", "Sixth Floor Media - CommonSpace");
    map.put("application/vnd.yamaha.smaf-audio", "SMAF Audio");
    map.put("application/vnd.smaf", "SMAF File");
    map.put("application/vnd.yamaha.smaf-phrase", "SMAF Phrase");
    map.put("application/vnd.smart.teacher", "SMART Technologies Apps");
    map.put("application/vnd.svd", "SourceView Document");
    map.put("application/sparql-query", "SPARQL - Query");
    map.put("application/sparql-results+xml", "SPARQL - Results");
    map.put("application/srgs", "Speech Recognition Grammar Specification");
    map.put("application/srgs+xml", "Speech Recognition Grammar Specification - XML");
    map.put("application/ssml+xml", "Speech Synthesis Markup Language");
    map.put("application/vnd.koan", "SSEYO Koan Play File");
    map.put("text/sgml", "Standard Generalized Markup Language (SGML)");
    map.put("application/vnd.stardivision.calc", "StarOffice - Calc");
    map.put("application/vnd.stardivision.draw", "StarOffice - Draw");
    map.put("application/vnd.stardivision.impress", "StarOffice - Impress");
    map.put("application/vnd.stardivision.math", "StarOffice - Math");
    map.put("application/vnd.stardivision.writer", "StarOffice - Writer");
    map.put("application/vnd.stardivision.writer-global", "StarOffice - Writer (Global)");
    map.put("application/vnd.stepmania.stepchart", "StepMania");
    map.put("application/x-stuffit", "Stuffit Archive");
    map.put("application/x-stuffitx", "Stuffit Archive");
    map.put("application/vnd.solent.sdkm+xml", "SudokuMagic");
    map.put("application/vnd.olpc-sugar", "Sugar Linux Application Bundle");
    map.put("audio/basic", "Sun Audio - Au file format");
    map.put("application/vnd.wqd", "SundaHus WQ");
    map.put("application/vnd.symbian.install", "Symbian Install Package");
    map.put("application/smil+xml", "Synchronized Multimedia Integration Language");
    map.put("application/vnd.syncml+xml", "SyncML");
    map.put("application/vnd.syncml.dm+wbxml", "SyncML - Device Management");
    map.put("application/vnd.syncml.dm+xml", "SyncML - Device Management");
    map.put("application/x-sv4cpio", "System V Release 4 CPIO Archive");
    map.put("application/x-sv4crc", "System V Release 4 CPIO Checksum Data");
    map.put("application/sbml+xml", "Systems Biology Markup Language");
    map.put("text/tab-separated-values", "Tab Seperated Values");
    map.put("image/tiff", "Tagged Image File Format");
    map.put("application/vnd.tao.intent-module-archive", "Tao Intent");
    map.put("application/x-tar", "Tar File (Tape Archive)");
    map.put("application/x-tcl", "Tcl Script");
    map.put("application/x-tex", "TeX");
    map.put("application/x-tex-tfm", "TeX Font Metric");
    map.put("application/tei+xml", "Text Encoding and Interchange");
    map.put("text/plain", "Text File");
    map.put("application/vnd.spotfire.dxp", "TIBCO Spotfire");
    map.put("application/vnd.spotfire.sfs", "TIBCO Spotfire");
    map.put("application/timestamped-data", "Time Stamped Data Envelope");
    map.put("application/vnd.trid.tpt", "TRI Systems Config");
    map.put("application/vnd.triscape.mxs", "Triscape Map Explorer");
    map.put("text/troff", "troff");
    map.put("application/vnd.trueapp", "True BASIC");
    map.put("application/x-font-ttf", "TrueType Font");
    map.put("text/turtle", "Turtle (Terse RDF Triple Language)");
    map.put("application/vnd.umajin", "UMAJIN");
    map.put("application/vnd.uoml+xml", "Unique Object Markup Language");
    map.put("application/vnd.unity", "Unity 3d");
    map.put("application/vnd.ufdl", "Universal Forms Description Language");
    map.put("text/uri-list", "URI Resolution Services");
    map.put("application/vnd.uiq.theme", "User Interface Quartz - Theme (Symbian)");
    map.put("application/x-ustar", "Ustar (Uniform Standard Tape Archive)");
    map.put("text/x-uuencode", "UUEncode");
    map.put("text/x-vcalendar", "vCalendar");
    map.put("text/x-vcard", "vCard");
    map.put("application/x-cdlink", "Video CD");
    map.put("application/vnd.vsf", "Viewport+");
    map.put("model/vrml", "Virtual Reality Modeling Language");
    map.put("application/vnd.vcx", "VirtualCatalog");
    map.put("model/vnd.mts", "Virtue MTS");
    map.put("model/vnd.vtu", "Virtue VTU");
    map.put("application/vnd.visionary", "Visionary");
    map.put("video/vnd.vivo", "Vivo");
    map.put("application/ccxml+xml,", "Voice Browser Call Control");
    map.put("application/voicexml+xml", "VoiceXML");
    map.put("application/x-wais-source", "WAIS Source");
    map.put("application/vnd.wap.wbxml", "WAP Binary XML (WBXML)");
    map.put("image/vnd.wap.wbmp", "WAP Bitamp (WBMP)");
    map.put("audio/x-wav", "Waveform Audio File Format (WAV)");
    map.put("application/davmount+xml", "Web Distributed Authoring and Versioning");
    map.put("application/x-font-woff", "Web Open Font Format");
    map.put("application/wspolicy+xml", "Web Services Policy");
    map.put("image/webp", "WebP Image");
    map.put("application/vnd.webturbo", "WebTurbo");
    map.put("application/widget", "Widget Packaging and XML Configuration");
    map.put("application/winhlp", "WinHelp");
    map.put("text/vnd.wap.wml", "Wireless Markup Language (WML)");
    map.put("text/vnd.wap.wmlscript", "Wireless Markup Language Script (WMLScript)");
    map.put("application/vnd.wap.wmlscriptc", "WMLScript");
    map.put("application/vnd.wordperfect", "Wordperfect");
    map.put("application/vnd.wt.stf", "Worldtalk");
    map.put("application/wsdl+xml", "WSDL - Web Services Description Language");
    map.put("image/x-xbitmap", "X BitMap");
    map.put("image/x-xpixmap", "X PixMap");
    map.put("image/x-xwindowdump", "X Window Dump");
    map.put("application/x-x509-ca-cert", "X.509 Certificate");
    map.put("application/x-xfig", "Xfig");
    map.put("application/xhtml+xml", "XHTML - The Extensible HyperText Markup Language");
    map.put("application/xml", "XML - Extensible Markup Language");
    map.put("application/xcap-diff+xml", "XML Configuration Access Protocol - XCAP Diff");
    map.put("application/xenc+xml", "XML Encryption Syntax and Processing");
    map.put("application/patch-ops-error+xml", "XML Patch Framework");
    map.put("application/resource-lists+xml", "XML Resource Lists");
    map.put("application/rls-services+xml", "XML Resource Lists");
    map.put("application/resource-lists-diff+xml", "XML Resource Lists Diff");
    map.put("application/xslt+xml", "XML Transformations");
    map.put("application/xop+xml", "XML-Binary Optimized Packaging");
    map.put("application/x-xpinstall", "XPInstall - Mozilla");
    map.put("application/xspf+xml", "XSPF - XML Shareable Playlist Format");
    map.put("application/vnd.mozilla.xul+xml", "XUL - XML User Interface Language");
    map.put("chemical/x-xyz", "XYZ File Format");
    map.put("text/yaml", "YAML Ain't Markup Language / Yet Another Markup Language");
    map.put("application/yang", "YANG Data Modeling Language");
    map.put("application/yin+xml", "YIN (YANG - XML)");
    map.put("application/vnd.zul", "Z.U.L. Geometry");
    map.put("application/zip", "Zip Archive");
    map.put("application/vnd.handheld-entertainment+xml", "ZVUE Media Manager");
    map.put("application/vnd.zzazz.deck+xml", "Zzazz Deck");
    return map;
  }
}
