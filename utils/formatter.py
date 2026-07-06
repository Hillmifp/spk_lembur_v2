from datetime import datetime

bulan_id = {
    'January': 'Januari',
    'February': 'Februari',
    'March': 'Maret',
    'April': 'April',
    'May': 'Mei',
    'June': 'Juni',
    'July': 'Juli',
    'August': 'Agustus',
    'September': 'September',
    'October': 'Oktober',
    'November': 'November',
    'December': 'Desember'
}

hari_id = {
    'Monday': 'Senin',
    'Tuesday': 'Selasa',
    'Wednesday': 'Rabu',
    'Thursday': 'Kamis',
    'Friday': 'Jumat',
    'Saturday': 'Sabtu',
    'Sunday': 'Minggu'
}


def format_tanggal_indonesia(tgl):

    bulan = bulan_id.get(
        tgl.strftime("%B"),
        tgl.strftime("%B")
    )

    return tgl.strftime(f"%d {bulan} %Y")


def get_nama_bulan(tgl):

    return bulan_id.get(
        tgl.strftime("%B"),
        tgl.strftime("%B")
    )


def get_nama_hari(tgl):

    return hari_id.get(
        tgl.strftime("%A"),
        tgl.strftime("%A")
    )